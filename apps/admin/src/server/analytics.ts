import { DateTime } from "luxon";
import { createServiceClient } from "@/libs/supabase/service";
import {
  activityDays,
  countBy,
  scansPerHour,
  scheduleHourBounds,
} from "@/utils";

export type EventAnalytics = {
  totals: { scans: number; participants: number; spots: number };
  /** Días con horario o escaneos, para el selector. */
  days: { day: string; label: string }[];
  /** Día que se está graficando (ISO), o null si no hay actividad. */
  selectedDay: string | null;
  /** Escaneos por hora del día seleccionado, encuadrados por el horario. */
  perHour: { hour: number; label: string; count: number }[];
  /** Escaneos por spot, ordenado descendente (incluye spots en cero). */
  perSpot: { name: string; count: number }[];
  /** Últimos escaneos, más reciente primero. */
  recent: { id: number; user: string; spot: string; when: string }[];
};

const RECENT_LIMIT = 10;

const dayLabel = (day: string, zone: string) =>
  DateTime.fromISO(day, { zone }).setLocale("es-AR").toFormat("ccc d MMM");

/**
 * Métricas de un evento a partir de `user_spot_history`. El gráfico temporal
 * es por hora de un día puntual (`requestedDay`); la mayoría de los eventos
 * dura un solo día, y si hay varios se cambia con el selector. Mismo contrato
 * de autorización que el resto de src/server (ver events.ts).
 */
export async function getEventAnalytics(
  organizationId: string,
  eventId: string,
  timezone: string,
  requestedDay?: string,
): Promise<EventAnalytics> {
  const service = createServiceClient();

  const { data: spots } = await service
    .from("event_spots")
    .select("id, name, event:event_id!inner(organization_id)")
    .eq("event_id", eventId)
    .eq("event.organization_id", organizationId);

  const spotNames = new Map((spots ?? []).map((spot) => [spot.id, spot.name]));

  const [{ data: schedules }, { data: scans }] = await Promise.all([
    service
      .from("event_schedules")
      .select("start_datetime, end_datetime")
      .eq("event_id", eventId),
    spotNames.size
      ? service
          .from("user_spot_history")
          .select("id, spot_id, user_id, collected_at")
          .in("spot_id", [...spotNames.keys()])
          .order("collected_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const allScans = scans ?? [];
  const allSchedules = schedules ?? [];

  const days = activityDays(allScans, allSchedules, timezone);
  const scanDays = new Set(activityDays(allScans, [], timezone));
  const today = DateTime.now().setZone(timezone).toISODate();

  // Prioridad: día pedido válido → hoy si es un día del evento → el último
  // día con escaneos → el primer día programado.
  const selectedDay =
    (requestedDay && days.includes(requestedDay) ? requestedDay : null) ??
    (today && days.includes(today) ? today : null) ??
    [...days].reverse().find((day) => scanDays.has(day)) ??
    days[0] ??
    null;

  const perSpotCounts = countBy(allScans, (scan) => scan.spot_id);

  const recentScans = allScans.slice(0, RECENT_LIMIT);
  const userIds = [...new Set(recentScans.map((scan) => scan.user_id))];
  const { data: profiles } = userIds.length
    ? await service.from("profiles").select("id, fullname").in("id", userIds)
    : { data: [] };
  const userNames = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.fullname]),
  );

  return {
    totals: {
      scans: allScans.length,
      participants: new Set(allScans.map((scan) => scan.user_id)).size,
      spots: spotNames.size,
    },
    days: days.map((day) => ({ day, label: dayLabel(day, timezone) })),
    selectedDay,
    perHour: selectedDay
      ? scansPerHour(
          allScans,
          timezone,
          selectedDay,
          scheduleHourBounds(allSchedules, timezone, selectedDay) ?? undefined,
        )
      : [],
    perSpot: [...spotNames.entries()]
      .map(([id, name]) => ({ name, count: perSpotCounts.get(id) ?? 0 }))
      .sort((a, b) => b.count - a.count),
    recent: recentScans.map((scan) => ({
      id: scan.id,
      user: userNames.get(scan.user_id) ?? "Participante",
      spot: spotNames.get(scan.spot_id) ?? "—",
      when: DateTime.fromISO(scan.collected_at)
        .setZone(timezone)
        .setLocale("es-AR")
        .toFormat("d MMM HH:mm"),
    })),
  };
}

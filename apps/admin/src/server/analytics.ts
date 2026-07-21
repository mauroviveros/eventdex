import { DateTime } from "luxon";
import { createServiceClient } from "@/libs/supabase/service";
import { countBy, scansPerDay } from "@/utils";

export type EventAnalytics = {
  totals: { scans: number; participants: number; spots: number };
  /** Escaneos por día calendario del evento, con huecos rellenados. */
  perDay: { day: string; label: string; count: number }[];
  /** Escaneos por spot, ordenado descendente (incluye spots en cero). */
  perSpot: { name: string; count: number }[];
  /** Últimos escaneos, más reciente primero. */
  recent: { id: number; user: string; spot: string; when: string }[];
};

const RECENT_LIMIT = 10;

/**
 * Métricas de un evento a partir de `user_spot_history`. Mismo contrato que el
 * resto de src/server: el caller pasó por `requireMembership()` y el join con
 * `events.organization_id` autoriza el acceso.
 */
export async function getEventAnalytics(
  organizationId: string,
  eventId: string,
  timezone: string,
): Promise<EventAnalytics> {
  const service = createServiceClient();

  const { data: spots } = await service
    .from("event_spots")
    .select("id, name, event:event_id!inner(organization_id)")
    .eq("event_id", eventId)
    .eq("event.organization_id", organizationId);

  const spotNames = new Map((spots ?? []).map((spot) => [spot.id, spot.name]));

  const { data: scans } = spotNames.size
    ? await service
        .from("user_spot_history")
        .select("id, spot_id, user_id, collected_at")
        .in("spot_id", [...spotNames.keys()])
        .order("collected_at", { ascending: false })
    : { data: [] };

  const allScans = scans ?? [];
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
    perDay: scansPerDay(allScans, timezone).map((entry) => ({
      ...entry,
      label: DateTime.fromISO(entry.day, { zone: timezone })
        .setLocale("es-AR")
        .toFormat("d MMM"),
    })),
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

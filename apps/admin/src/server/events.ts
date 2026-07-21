import type { Tables } from "@eventdex/database";
import { createServiceClient } from "@/libs/supabase/service";
import { countBy, scheduleRange } from "@/utils";

export type EventDetail = Tables<"events"> & {
  location: Tables<"event_locations"> | null;
  schedules: Tables<"event_schedules">[];
};

/** URL pública del evento (deploy de apps/event) si está configurada. */
export function eventSiteUrl(
  config: Tables<"events">["config"],
): string | null {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    return null;
  }
  const value = (config as { siteUrl?: unknown }).siteUrl;
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Evento puntual de la organización, con ubicación y horarios ordenados.
 * Null si no existe, está soft-deleted o pertenece a otra organización — el
 * filtro por `organization_id` es la barrera de autorización (el service
 * client no pasa por RLS), así que siempre va junto al id.
 */
export async function getOrganizationEvent(
  organizationId: string,
  eventId: string,
): Promise<EventDetail | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("events")
    .select("*, location:event_locations(*), schedules:event_schedules(*)")
    .eq("id", eventId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;

  return {
    ...data,
    schedules: data.schedules.toSorted((a, b) =>
      a.start_datetime.localeCompare(b.start_datetime),
    ),
  };
}

export type OrganizationEvent = {
  id: string;
  title: string;
  edition: string | null;
  status: "ACTIVE" | "INACTIVE" | null;
  timezone: string;
  city: string | null;
  /** Rango total del evento (min inicio / max fin de sus horarios). */
  range: { start: string; end: string } | null;
  spotCount: number;
  scanCount: number;
  participantCount: number;
};

/**
 * Eventos de la organización con sus métricas básicas (spots, escaneos,
 * participantes únicos). Usa el service client: el caller DEBE haber pasado por
 * `requireMembership()` antes (las políticas RLS no cubren lecturas org-wide).
 *
 * Los escaneos se agregan en JS a partir de `user_spot_history`; a la escala
 * actual (miles de filas) es más simple que una RPC y suficiente.
 */
export async function getOrganizationEvents(
  organizationId: string,
): Promise<OrganizationEvent[]> {
  const service = createServiceClient();

  const { data: events } = await service
    .from("events")
    .select(
      "id, title, edition, status, timezone, created_at, location:event_locations(city), schedules:event_schedules(start_datetime, end_datetime), spots:event_spots(id)",
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!events || events.length === 0) return [];

  const spotToEvent = new Map<string, string>();
  for (const event of events) {
    for (const spot of event.spots) {
      spotToEvent.set(spot.id, event.id);
    }
  }

  const spotIds = [...spotToEvent.keys()];
  const { data: scans } = spotIds.length
    ? await service
        .from("user_spot_history")
        .select("spot_id, user_id")
        .in("spot_id", spotIds)
    : { data: [] };

  const scanRows = (scans ?? []).map((scan) => ({
    eventId: spotToEvent.get(scan.spot_id) ?? "",
    userId: scan.user_id,
  }));
  const scansPerEvent = countBy(scanRows, (scan) => scan.eventId);
  const participantsPerEvent = countBy(
    [...new Set(scanRows.map((scan) => `${scan.eventId}:${scan.userId}`))],
    (pair) => pair.split(":")[0],
  );

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    edition: event.edition,
    status: event.status,
    timezone: event.timezone,
    city: event.location?.city ?? null,
    range: scheduleRange(event.schedules),
    spotCount: event.spots.length,
    scanCount: scansPerEvent.get(event.id) ?? 0,
    participantCount: participantsPerEvent.get(event.id) ?? 0,
  }));
}

import type { Tables } from "@eventdex/database";
import { createServiceClient } from "@/libs/supabase/service";
import { countBy } from "@/utils";

export type EventSpot = Tables<"event_spots"> & {
  avatar_url: string;
  scanCount: number;
};

/**
 * Spots de un evento de la organización, con URL pública del avatar y conteo
 * de escaneos. Como en events.ts, el service client no pasa por RLS: el join
 * con `events.organization_id` es la autorización.
 */
export async function getEventSpots(
  organizationId: string,
  eventId: string,
): Promise<EventSpot[]> {
  const service = createServiceClient();

  const { data: spots } = await service
    .from("event_spots")
    .select("*, event:event_id!inner(organization_id)")
    .eq("event_id", eventId)
    .eq("event.organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (!spots || spots.length === 0) return [];

  const { data: scans } = await service
    .from("user_spot_history")
    .select("spot_id")
    .in(
      "spot_id",
      spots.map((spot) => spot.id),
    );
  const scanCounts = countBy(scans ?? [], (scan) => scan.spot_id);

  return spots.map(({ event: _event, ...spot }) => ({
    ...spot,
    avatar_url: service.storage.from("spot").getPublicUrl(spot.avatar_path).data
      .publicUrl,
    scanCount: scanCounts.get(spot.id) ?? 0,
  }));
}

/** Spot puntual, validando que pertenezca a la organización. */
export async function getEventSpot(
  organizationId: string,
  eventId: string,
  spotId: string,
): Promise<EventSpot | null> {
  const spots = await getEventSpots(organizationId, eventId);
  return spots.find((spot) => spot.id === spotId) ?? null;
}

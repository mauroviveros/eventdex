import { z } from "zod";
import { resolvePublishedSpot } from "@/domain/spots";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Reads for the visitor's medals. A failed read throws, so error.tsx shows it.
 */

/**
 * The spot a QR points to, if it's of a published event of this org, with what
 * the public sees of it. Null otherwise: /s/[id] checks this before claiming,
 * so another org's QR scanned on this domain is a 404 and not a medal.
 */
export async function getClaimTarget(
  supabase: Supabase,
  organizationId: string,
  eventSpotId: string,
) {
  if (!z.uuid().safeParse(eventSpotId).success) return null;
  const { data, error } = await supabase
    .from("event_spots")
    .select(
      `id, code, booth, points, name_override, description_override, snapshot,
       event:events!inner (id, slug, title, timezone)`,
    )
    .eq("id", eventSpotId)
    .eq("organization_id", organizationId)
    // Members also read their drafts: the QR only works on published events.
    .eq("event.status", "published")
    .is("event.deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const shown = resolvePublishedSpot(data);
  if (!shown) return null;
  const { event, id, code, booth, points } = data;
  return { event, spot: { id, code, booth, points, ...shown } };
}

/**
 * The visitor's medals in one event, oldest first. Filtered by user: the org
 * team reads everyone's under RLS, and this is "mine" for them too.
 */
export async function listMyClaims(
  supabase: Supabase,
  eventId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("spot_claims")
    .select("event_spot_id, claimed_at")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .order("claimed_at");
  if (error) throw error;
  return data;
}

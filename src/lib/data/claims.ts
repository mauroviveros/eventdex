import { z } from "zod";
import { collectionProgress } from "@/domain/claims";
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

/**
 * Who registered in an event (their first valid scan), newest first, with how
 * many medals each has. Only the org's team and the developer read this.
 */
// shortcut: the whole list in one read (PostgREST caps it at max-rows), paginate or search when an event passes ~1000 visitors
export async function listEventVisitors(supabase: Supabase, eventId: string) {
  const { data, error } = await supabase
    .from("event_registrations")
    .select(
      `id, created_at, blocked_at,
       profile:profiles (full_name, display_name, email),
       claims:spot_claims (count)`,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(({ claims, profile, ...r }) => ({
    ...r,
    // The embed goes through profiles RLS: never assume it came back.
    name:
      profile?.display_name ||
      profile?.full_name ||
      profile?.email ||
      "Visitante",
    email: profile?.email ?? "",
    medals: claims[0]?.count ?? 0,
  }));
}

/**
 * The visitor's progress in one event: medals and points over its active
 * spots. What the celebration needs, without reading the whole event.
 */
export async function getMyProgress(
  supabase: Supabase,
  eventId: string,
  userId: string,
) {
  const [spots, mine] = await Promise.all([
    supabase
      .from("event_spots")
      .select("id, points")
      .eq("event_id", eventId)
      .eq("is_active", true),
    listMyClaims(supabase, eventId, userId),
  ]);
  if (spots.error) throw spots.error;
  return collectionProgress(
    spots.data,
    mine.map((c) => c.event_spot_id),
  );
}

/**
 * The slug of the last event of this org where the visitor collected (their
 * registration is born with the first medal). Null if they never did.
 */
export async function getLastCollectedEventSlug(
  supabase: Supabase,
  organizationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("event:events!inner (slug)")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("event.status", "published")
    .is("event.deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.event.slug ?? null;
}

import type { Supabase } from "@/lib/supabase/server";

/**
 * Reads for the event screens. RLS decides what each user gets; these
 * functions only shape the query. A failed read throws, so the segment's
 * error.tsx shows it. Dropped rows (deleted_at) never come back.
 */

/** The organization's venues, by name. */
export async function listVenues(supabase: Supabase, organizationId: string) {
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, address_line, city, state, postal_code, timezone")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data;
}

/**
 * The organization's events, newest first, with venue and schedules for phase
 * and dates, and how each went: active stands, registered visitors, medals.
 */
export async function listEvents(supabase: Supabase, organizationId: string) {
  const { data, error } = await supabase
    .from("events")
    .select(
      `id, slug, title, edition_label, status, timezone,
       venue:venues (name),
       schedules:event_schedules (starts_at, ends_at),
       stands:event_spots (count),
       visitors:event_registrations (count),
       claims:event_spots (spot_claims (count))`,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    // Only active spots count as stands: an inactive one gives no medal.
    .eq("stands.is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(({ stands, visitors, claims, ...e }) => ({
    ...e,
    stats: {
      stands: stands[0]?.count ?? 0,
      visitors: visitors[0]?.count ?? 0,
      // Claims hang from the event's spots (any, active or not): add them up.
      // shortcut: one count row per spot, move to a count grouped by event_id past ~50 spots per event
      medals: claims.reduce((n, s) => n + (s.spot_claims[0]?.count ?? 0), 0),
    },
  }));
}

/** The title of the org's latest event, to start the next one from. */
export async function getLastEventTitle(
  supabase: Supabase,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select("title")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.title ?? null;
}

/** What the form to duplicate an event starts from. Null if hidden or missing. */
export async function getEventToDuplicate(
  supabase: Supabase,
  organizationId: string,
  slug: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, summary, venue_id, spots:event_spots (spot:spots (archived_at))",
    )
    .eq("organization_id", organizationId)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const archived = data.spots.filter((s) => s.spot.archived_at).length;
  return {
    id: data.id,
    title: data.title,
    summary: data.summary,
    venueId: data.venue_id,
    spots: data.spots.length - archived,
    archived,
  };
}

/** One event by slug inside an organization, with its schedules in order. Null if hidden or missing. */
export async function getEventBySlug(
  supabase: Supabase,
  organizationId: string,
  slug: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select(
      `id, slug, title, edition_label, summary, description, cover_path, status,
       visibility, timezone, published_at, venue_id,
       venue:venues (id, name, address_line, city),
       schedules:event_schedules (id, label, starts_at, ends_at)`,
    )
    .eq("organization_id", organizationId)
    .eq("slug", slug)
    .is("deleted_at", null)
    .order("starts_at", { referencedTable: "event_schedules" })
    .maybeSingle();
  if (error) throw error;
  return data;
}

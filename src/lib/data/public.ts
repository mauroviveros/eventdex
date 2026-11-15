import type { QueryData } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { resolvePublishedSpot } from "@/domain/spots";
import { createPublicClient } from "@/lib/supabase/public";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Reads for the public app (the org's own domain). Everything here is what anon
 * can see; RLS is the barrier. A failed read throws, so error.tsx shows it.
 */

/**
 * Tag for every cached organization lookup. Every action that changes an org
 * (name, brand, status) or its domains calls invalidateOrganizations().
 */
export const ORGANIZATIONS_TAG = "organizations";

// shortcut: unstable_cache (legacy in Next 16), move to "use cache" + cacheTag
// when cacheComponents is turned on for the whole app.
const lookupOrganization = unstable_cache(
  async (host: string) => {
    const { data, error } = await createPublicClient()
      .rpc("resolve_organization", { p_host: host })
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  ["organization-by-host"],
  // A minute: what changes outside an action (SQL, support) shows up soon.
  { revalidate: 60, tags: [ORGANIZATIONS_TAG] },
);

/**
 * The organization a host serves, or null (unknown host, suspended org). One
 * query, cached across requests and instances: hosts almost never change.
 */
export const getOrganizationByHost = cache((host: string) =>
  lookupOrganization(host.toLowerCase()),
);

const EVENT_COLUMNS = `id, organization_id, slug, title, edition_label, summary, description, cover_path,
  timezone, status, visibility,
  venue:venues (name, address_line, city, state),
  schedules:event_schedules (id, label, starts_at, ends_at),
  spots:event_spots (id, code, booth, perk, perk_hidden, points, is_active, sort_order,
                     name_override, description_override, snapshot),
  raffles (winners_published_at),
  website_url, instagram_url, tickets_url, map_url,
  faqs:event_faqs (id, question, answer),
  photos:event_photos (id, path, caption)`;

/**
 * A published event of the org by slug, with its schedules in order and its
 * active spots, each already showing what the public sees. Null if missing, a
 * draft or dropped.
 */
export async function getPublicEvent(
  supabase: Supabase,
  organizationId: string,
  slug: string,
  // The team's preview reads any status: RLS lets only its members see the rest.
  { drafts = false }: { drafts?: boolean } = {},
) {
  let query = supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("slug", slug)
    .is("deleted_at", null);
  if (!drafts) query = query.eq("status", "published");
  const { data, error } = await query
    .order("starts_at", { referencedTable: "event_schedules" })
    .order("sort_order", { referencedTable: "event_spots" })
    .order("code", { referencedTable: "event_spots" })
    .order("sort_order", { referencedTable: "event_faqs" })
    .order("created_at", { referencedTable: "event_faqs" })
    .order("id", { referencedTable: "event_faqs" })
    .order("sort_order", { referencedTable: "event_photos" })
    .order("created_at", { referencedTable: "event_photos" })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toPublicEvent(drafts ? await freezeFromCatalog(supabase, data) : data);
}

/**
 * A draft's spots have no snapshot yet (publishing takes it): read them from
 * the catalog, as they would be frozen, so the preview shows its medals.
 */
async function freezeFromCatalog(supabase: Supabase, event: EventRow) {
  const { data, error } = await supabase
    .from("event_spots")
    .select("id, spot:spots (name, description, logo_path, type)")
    .eq("event_id", event.id);
  if (error) throw error;
  const catalog = new Map(data.map((s) => [s.id, s.spot]));
  return {
    ...event,
    spots: event.spots.map((s) => ({
      ...s,
      snapshot: resolvePublishedSpot(s)
        ? s.snapshot
        : (catalog.get(s.id) ?? null),
    })),
  };
}

/**
 * The event the org's home shows (live, else next, else last) in one round
 * trip: active_event returns the row, so the schedules, venue and spots embed
 * in the same call. Null if the org has none.
 */
export async function getActiveEvent(
  supabase: Supabase,
  organizationId: string,
) {
  const { data, error } = await supabase
    .rpc("active_event", { p_organization_id: organizationId })
    .select(EVENT_COLUMNS)
    .order("starts_at", { referencedTable: "event_schedules" })
    .order("sort_order", { referencedTable: "event_spots" })
    .order("code", { referencedTable: "event_spots" })
    .order("sort_order", { referencedTable: "event_faqs" })
    .order("created_at", { referencedTable: "event_faqs" })
    .order("id", { referencedTable: "event_faqs" })
    .order("sort_order", { referencedTable: "event_photos" })
    .order("created_at", { referencedTable: "event_photos" })
    .maybeSingle();
  if (error) throw error;
  return data && toPublicEvent(data);
}

// The row both reads return: the select string decides its shape.
const eventQuery = (supabase: Supabase) =>
  supabase.from("events").select(EVENT_COLUMNS);
type EventRow = QueryData<ReturnType<typeof eventQuery>>[number];

/** Keeps the active spots and resolves what each shows from its snapshot. */
function toPublicEvent({
  spots,
  raffles,
  website_url,
  instagram_url,
  tickets_url,
  map_url,
  ...event
}: EventRow) {
  return {
    ...event,
    links: {
      website: website_url,
      instagram: instagram_url,
      tickets: tickets_url,
      map: map_url,
    },
    // Checked here: a signed-in member also reads the unpublished ones.
    hasWinners: raffles.some((r) => r.winners_published_at),
    spots: spots.flatMap((s) => {
      const shown = s.is_active ? resolvePublishedSpot(s) : null;
      return shown
        ? [
            {
              id: s.id,
              code: s.code,
              booth: s.booth,
              perk: s.perk,
              perkHidden: s.perk_hidden,
              points: s.points,
              ...shown,
            },
          ]
        : [];
    }),
  };
}

/**
 * The org's finished editions with how many people played and how many medals
 * they got, newest first (up to six). Totals only: the function never returns
 * a person. `eventId` leaves out the event being shown.
 */
export async function getPastEditions(
  supabase: Supabase,
  organizationId: string,
  eventId: string,
) {
  const { data, error } = await supabase.rpc("past_editions", {
    p_organization_id: organizationId,
    p_event_id: eventId,
  });
  if (error) throw error;
  return data.map((e) => ({
    slug: e.slug,
    title: e.title,
    editionLabel: e.edition_label,
    endedAt: e.ended_at,
    visitors: Number(e.visitors),
    medals: Number(e.medals),
  }));
}

/**
 * The id of the event the org's home shows, or null if it has none. Pages that
 * point the visitor back to the event ask it first: a past event's QR has no
 * page to go back to.
 */
export async function getActiveEventId(
  supabase: Supabase,
  organizationId: string,
) {
  const { data, error } = await supabase.rpc("resolve_active_event", {
    p_organization_id: organizationId,
  });
  if (error) throw error;
  return data;
}

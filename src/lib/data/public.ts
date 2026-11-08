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

const EVENT_COLUMNS = `id, slug, title, edition_label, summary, description, cover_path,
  timezone, status, visibility,
  venue:venues (name, address_line, city, state),
  schedules:event_schedules (id, label, starts_at, ends_at),
  spots:event_spots (id, code, booth, points, is_active, sort_order,
                     name_override, description_override, snapshot)`;

/**
 * A published event of the org by slug, with its schedules in order and its
 * active spots, each already showing what the public sees. Null if missing, a
 * draft or dropped.
 */
export async function getPublicEvent(
  supabase: Supabase,
  organizationId: string,
  slug: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("starts_at", { referencedTable: "event_schedules" })
    .order("sort_order", { referencedTable: "event_spots" })
    .order("code", { referencedTable: "event_spots" })
    .maybeSingle();
  if (error) throw error;
  return data && toPublicEvent(data);
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
    .maybeSingle();
  if (error) throw error;
  return data && toPublicEvent(data);
}

// The row both reads return: the select string decides its shape.
const eventQuery = (supabase: Supabase) =>
  supabase.from("events").select(EVENT_COLUMNS);
type EventRow = QueryData<ReturnType<typeof eventQuery>>[number];

/** Keeps the active spots and resolves what each shows from its snapshot. */
function toPublicEvent({ spots, ...event }: EventRow) {
  return {
    ...event,
    spots: spots.flatMap((s) => {
      const shown = s.is_active ? resolvePublishedSpot(s) : null;
      return shown
        ? [
            {
              id: s.id,
              code: s.code,
              booth: s.booth,
              points: s.points,
              ...shown,
            },
          ]
        : [];
    }),
  };
}

/** Published public events for the sitemap, newest change first. */
export async function listPublicEvents(
  supabase: Supabase,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select("slug, updated_at, published_at")
    .eq("organization_id", organizationId)
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data;
}

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { resolvePublishedSpot } from "@/domain/spots";
import { createPublicClient } from "@/lib/supabase/public";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Reads for the public app (the org's own domain). Everything here is what anon
 * can see; RLS is the barrier. A failed read throws, so error.tsx shows it.
 */

/** Tag for every cached organization lookup; revalidate it when orgs or domains change. */
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
  { revalidate: 300, tags: [ORGANIZATIONS_TAG] },
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

type Selector = { by: "id"; value: string } | { by: "slug"; value: string };

/**
 * A published event of the org with its schedules in order and its active
 * spots, each already showing what the public sees. Null if missing, a draft
 * or dropped.
 */
export async function getPublicEvent(
  supabase: Supabase,
  organizationId: string,
  which: Selector,
) {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq(which.by, which.value)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("starts_at", { referencedTable: "event_schedules" })
    .order("sort_order", { referencedTable: "event_spots" })
    .order("code", { referencedTable: "event_spots" })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { spots, ...event } = data;
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

/** The event the org's home shows (live, else next, else last), or null. */
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

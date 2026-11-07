import { resolveSpot } from "@/domain/spots";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Reads for the catalog and the event spots. RLS decides what each user gets;
 * a failed read throws, so the segment's error.tsx shows it.
 */

/** The catalog, by name, with how many live events use each spot. Archived ones last. */
export async function listSpots(supabase: Supabase, organizationId: string) {
  const { data, error } = await supabase
    .from("spots")
    .select(
      "id, name, description, type, logo_path, archived_at, uses:event_spots (id, event:events!inner (id))",
    )
    .eq("organization_id", organizationId)
    // Dropped events don't count: !inner drops their rows from `uses`.
    .is("uses.event.deleted_at", null)
    .order("archived_at", { nullsFirst: true })
    .order("name");
  if (error) throw error;
  return data.map(({ uses, ...spot }) => ({
    ...spot,
    uses: uses.length,
  }));
}

/** One catalog spot and the events it's in. Null if hidden or missing. */
export async function getSpot(
  supabase: Supabase,
  organizationId: string,
  id: string,
) {
  const { data, error } = await supabase
    .from("spots")
    .select(
      `id, name, description, type, logo_path, archived_at,
       uses:event_spots (id, code, event:events!inner (title, slug, status))`,
    )
    .eq("organization_id", organizationId)
    .eq("id", id)
    .is("uses.event.deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** An event's spots in display order, each with what it shows already resolved. */
export async function listEventSpots(supabase: Supabase, eventId: string) {
  const { data, error } = await supabase
    .from("event_spots")
    .select(
      `id, code, booth, points, is_active, sort_order,
       name_override, description_override, snapshot,
       spot:spots (id, name, description, logo_path, type)`,
    )
    .eq("event_id", eventId)
    .order("sort_order")
    .order("code");
  if (error) throw error;
  return data.flatMap(({ spot, ...es }) =>
    spot
      ? [
          {
            ...es,
            spotId: spot.id,
            shown: resolveSpot(es, spot),
            // What it shows with no override: the fallback for the override field.
            defaultName: resolveSpot({ ...es, name_override: null }, spot).name,
          },
        ]
      : [],
  );
}

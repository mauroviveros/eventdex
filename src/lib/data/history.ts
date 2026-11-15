import { buildHistory, type HistoryEdition } from "@/domain/history";
import type { Supabase } from "@/lib/supabase/server";

/**
 * The visitor's history in one organization. A failed read throws: the caller
 * decides what the page shows. Filtered by user: the org team reads everyone's rows
 * under RLS, and this is "mine" for them too.
 */
export async function getMyHistory(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  now = new Date(),
) {
  const [events, claims, wins] = await Promise.all([
    supabase
      .from("events")
      .select(
        `id, slug, title, edition_label, schedules:event_schedules (starts_at),
         spots:event_spots (count)`,
      )
      .eq("organization_id", organizationId)
      .eq("status", "published")
      .is("deleted_at", null)
      .eq("spots.is_active", true),
    supabase
      .from("spot_claims")
      .select("event_id")
      .eq("organization_id", organizationId)
      .eq("user_id", userId),
    supabase
      .from("raffle_draws")
      .select("raffle:raffles!inner (event_id)")
      .eq("organization_id", organizationId)
      .eq("winner_user_id", userId)
      .is("voided_at", null)
      .not("raffle.winners_published_at", "is", null),
  ]);
  if (events.error) throw events.error;
  if (claims.error) throw claims.error;
  if (wins.error) throw wins.error;

  const medals = countBy(claims.data.map((c) => c.event_id));
  const won = countBy(wins.data.map((w) => w.raffle.event_id));

  const editions = events.data.flatMap((e): HistoryEdition[] => {
    const startsAt = e.schedules
      .map((s) => s.starts_at)
      .sort()
      .at(0);
    // An edition that hasn't started yet is not part of the past.
    if (!startsAt || Date.parse(startsAt) > now.getTime()) return [];
    const total = e.spots[0]?.count ?? 0;
    return [
      {
        id: e.id,
        slug: e.slug,
        title: e.title,
        editionLabel: e.edition_label,
        startsAt,
        came: medals.has(e.id),
        // A stand deactivated after a scan keeps its claim but leaves the total.
        medals: Math.min(medals.get(e.id) ?? 0, total),
        total,
        wins: won.get(e.id) ?? 0,
      },
    ];
  });
  return buildHistory(editions);
}

function countBy(ids: readonly string[]) {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

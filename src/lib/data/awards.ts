import { visitorName } from "@/lib/data/claims";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Merit awards. The event's list is public (with how many won each, never who);
 * "mine" is the visitor's own wins; the winners are for the team, to hand them out.
 */

/** The awards of an event with how many places are taken, for whoever looks at it. */
export async function listEventAwards(supabase: Supabase, eventId: string) {
  const [awards, counts] = await Promise.all([
    supabase
      .from("event_awards")
      .select("id, title, description, kind, threshold, slots")
      .eq("event_id", eventId)
      .order("created_at")
      .order("id"),
    supabase.rpc("event_award_counts", { p_event_id: eventId }),
  ]);
  if (awards.error) throw awards.error;
  if (counts.error) throw counts.error;
  const taken = new Map(counts.data.map((c) => [c.award_id, Number(c.taken)]));
  return awards.data.map((a) => ({ ...a, taken: taken.get(a.id) ?? 0 }));
}

export type EventAward = Awaited<ReturnType<typeof listEventAwards>>[number];

/** What this visitor won in the event, in the order they won it. */
export async function listMyAwards(
  supabase: Supabase,
  eventId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("award_winners")
    .select("award_id, position, won_at, award:event_awards (title)")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .order("won_at")
    .order("position");
  if (error) throw error;
  return data.map((w) => ({
    awardId: w.award_id,
    title: w.award?.title ?? "",
    position: w.position,
    wonAt: w.won_at,
  }));
}

export type MyAward = Awaited<ReturnType<typeof listMyAwards>>[number];

/** Who won each award, first place first. Only the team and the developer read this. */
export async function listAwardWinners(supabase: Supabase, eventId: string) {
  const { data, error } = await supabase
    .from("award_winners")
    .select(
      `award_id, position, won_at,
       winner:profiles!award_winners_user_id_fkey (full_name, display_name, email)`,
    )
    .eq("event_id", eventId)
    .order("position")
    .order("won_at");
  if (error) throw error;
  return data.map((w) => ({
    awardId: w.award_id,
    position: w.position,
    wonAt: w.won_at,
    name: visitorName(w.winner),
    email: w.winner?.email ?? "",
  }));
}

export type AwardWinner = Awaited<ReturnType<typeof listAwardWinners>>[number];

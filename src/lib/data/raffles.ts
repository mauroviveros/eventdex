import { visitorName } from "@/lib/data/claims";
import type { Supabase } from "@/lib/supabase/server";

/**
 * The event's raffles for the panel, newest draw first, each with how many can
 * still come out. The staff reads the winner's full name, to call it out.
 */
export async function listEventRaffles(supabase: Supabase, eventId: string) {
  const { data, error } = await supabase
    .from("raffles")
    .select(
      `id, title, min_claims, winners_published_at,
       draws:raffle_draws (id, draw_number, winner_name, eligible_count, drawn_at,
                           voided_at, void_reason,
                           winner:profiles!raffle_draws_winner_user_id_fkey (full_name, display_name, email))`,
    )
    .eq("event_id", eventId)
    .order("created_at")
    .order("draw_number", {
      referencedTable: "raffle_draws",
      ascending: false,
    });
  if (error) throw error;

  return Promise.all(
    data.map(async ({ draws, ...raffle }) => {
      const { count, error: countError } = await supabase.rpc(
        "raffle_eligible",
        { p_raffle_id: raffle.id },
        { head: true, count: "exact" },
      );
      if (countError) throw countError;
      return {
        ...raffle,
        eligible: count ?? 0,
        draws: draws.map(({ winner, ...draw }) => ({
          ...draw,
          // A deleted account keeps the public name frozen at the draw.
          name: winner ? visitorName(winner) : draw.winner_name,
          email: winner?.email ?? "",
        })),
      };
    }),
  );
}

export type EventRaffle = Awaited<ReturnType<typeof listEventRaffles>>[number];

/**
 * The published winners of one event, or by default of the org's latest public
 * event that has any; null if none. Takes the public client: through a session,
 * a member's RLS would add voided draws.
 */
export async function getPublishedWinners(
  supabase: Supabase,
  organizationId: string,
  eventSlug?: string,
) {
  const { data, error } = await supabase
    .from("raffles")
    .select(
      `id, title, event_id, event:events (slug, title, visibility),
       winners:raffle_draws (id, winner_name)`,
    )
    .eq("organization_id", organizationId)
    .not("winners_published_at", "is", null)
    .order("winners_published_at", { ascending: false })
    .order("draw_number", { referencedTable: "raffle_draws" });
  if (error) throw error;

  // An event taken down comes back null; every draw voided, without winners.
  const shown = data.filter(
    (r) =>
      r.winners.length > 0 &&
      (eventSlug
        ? r.event?.slug === eventSlug
        : r.event?.visibility === "public"),
  );
  const latest = shown[0];
  if (!latest?.event) return null;
  return {
    eventTitle: latest.event.title,
    raffles: shown.filter((r) => r.event_id === latest.event_id),
  };
}

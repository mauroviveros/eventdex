import { publicName } from "@/domain/raffles";
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
 * Who can still win a raffle, for the screen shown on stage: only the public
 * name ("Ana G.") and the medals, never a mail or an id. Null if the raffle
 * doesn't exist or isn't the viewer's to see.
 */
// shortcut: the registrations in one read (PostgREST caps it at max-rows), page it when an event passes ~1000 visitors
export async function listRaffleParticipants(
  supabase: Supabase,
  raffleId: string,
) {
  const [raffle, eligible] = await Promise.all([
    supabase
      .from("raffles")
      .select("title, min_claims, event_id")
      .eq("id", raffleId)
      .maybeSingle(),
    supabase.rpc("raffle_eligible", { p_raffle_id: raffleId }),
  ]);
  if (raffle.error) throw raffle.error;
  if (eligible.error) throw eligible.error;
  if (!raffle.data) return null;

  const medals = new Map(eligible.data.map((e) => [e.user_id, e.claims]));
  const { data, error } = await supabase
    .from("event_registrations")
    .select("user_id, profile:profiles (full_name, display_name)")
    .eq("event_id", raffle.data.event_id)
    .in("user_id", [...medals.keys()]);
  if (error) throw error;

  return {
    title: raffle.data.title,
    minClaims: raffle.data.min_claims,
    participants: data
      .map((r) => ({
        // The embed goes through profiles RLS: never assume it came back.
        name: publicName(r.profile?.display_name || r.profile?.full_name),
        medals: Number(medals.get(r.user_id) ?? 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es-AR")),
  };
}

export type RaffleParticipants = NonNullable<
  Awaited<ReturnType<typeof listRaffleParticipants>>
>;

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

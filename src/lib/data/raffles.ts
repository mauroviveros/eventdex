import { chunked, publicNameOf } from "@/domain/raffles";
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

// Ids per request: they travel in the URL, and a few hundred in one overflow it.
const IDS_PER_READ = 100;

/**
 * Who can still win a raffle, for the screen shown on stage: only the public
 * name ("Ana G."), never a mail or an id. Null if the raffle doesn't exist or
 * isn't the viewer's to see.
 */
// shortcut: PostgREST cuts the eligible at max-rows (1000), show a count and page the names past ~1000 eligible
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
  const { title, min_claims: minClaims, event_id: eventId } = raffle.data;

  const reads = await Promise.all(
    chunked(
      eligible.data.map((e) => e.user_id),
      IDS_PER_READ,
    ).map((ids) =>
      supabase
        .from("event_registrations")
        .select("profile:profiles (full_name, display_name)")
        .eq("event_id", eventId)
        .in("user_id", ids),
    ),
  );
  const rows = reads.flatMap(({ data, error }) => {
    if (error) throw error;
    return data;
  });

  return {
    title,
    eventId,
    minClaims,
    // The embed goes through profiles RLS: never assume it came back.
    names: rows
      .map((r) => publicNameOf(r.profile))
      .sort((a, b) => a.localeCompare(b, "es-AR")),
  };
}

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

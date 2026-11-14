import { chunked, publicNameOf } from "@/domain/raffles";
import { visitorName } from "@/lib/data/claims";
import { prizeImageUrl } from "@/lib/data/organizations";
import type { Supabase } from "@/lib/supabase/server";

/**
 * The event's raffles for the panel, newest draw first, each with how many can
 * still come out. The staff reads the winner's full name, to call it out.
 */
export async function listEventRaffles(supabase: Supabase, eventId: string) {
  const { data, error } = await supabase
    .from("raffles")
    .select(
      `id, title, description, image_path, min_claims, winners_published_at,
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

/**
 * The prizes of an event for whoever looks at it, with or without a session:
 * no draws, no winners. RLS only lets through the raffles of a published event.
 */
export async function listEventPrizes(supabase: Supabase, eventId: string) {
  const { data, error } = await supabase
    .from("raffles")
    .select("id, title, description, image_path, min_claims")
    .eq("event_id", eventId)
    .order("min_claims")
    .order("title");
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    imageUrl: prizeImageUrl(r.image_path),
    minClaims: r.min_claims,
  }));
}

export type EventPrize = Awaited<ReturnType<typeof listEventPrizes>>[number];

export type EventRaffle = Awaited<ReturnType<typeof listEventRaffles>>[number];

// Ids per request: they travel in the URL, and a few hundred in one overflow it.
const IDS_PER_READ = 100;

/**
 * Who can still win a raffle, for the screen shown on stage: public name
 * ("Ana G."), medals and photo, never a mail or an id. Null if the raffle doesn't exist or
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
        .select(
          "user_id, profile:profiles (full_name, display_name, avatar_url)",
        )
        .eq("event_id", eventId)
        .in("user_id", ids),
    ),
  );
  const rows = reads.flatMap(({ data, error }) => {
    if (error) throw error;
    return data;
  });

  const claimsOf = new Map(eligible.data.map((e) => [e.user_id, e.claims]));
  // The embed goes through profiles RLS: never assume it came back.
  const participants = rows
    .map((r) => ({
      name: publicNameOf(r.profile),
      claims: claimsOf.get(r.user_id) ?? 0,
      avatarUrl: r.profile?.avatar_url ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es-AR"));

  return {
    title,
    eventId,
    minClaims,
    participants,
    totalClaims: participants.reduce((sum, p) => sum + p.claims, 0),
  };
}

/**
 * What the stage shows next to the name of the draw that just came out: the
 * winner's photo and how many medals they have. The draw already happened, so
 * a failed read here only leaves the card plainer.
 */
export async function getWinnerCard(supabase: Supabase, drawId: string) {
  const { data } = await supabase
    .from("raffle_draws")
    .select(
      `winner_user_id, raffle:raffles (event_id),
       winner:profiles!raffle_draws_winner_user_id_fkey (avatar_url)`,
    )
    .eq("id", drawId)
    .maybeSingle();
  const eventId = data?.raffle?.event_id;
  if (!data?.winner_user_id || !eventId)
    return { claims: null, avatarUrl: null };

  const { count } = await supabase
    .from("spot_claims")
    .select("id", { head: true, count: "exact" })
    .eq("event_id", eventId)
    .eq("user_id", data.winner_user_id);
  return { claims: count, avatarUrl: data.winner?.avatar_url ?? null };
}

/**
 * The latest draw that still stands, for the stage to open on it: without this
 * a reload would forget who just won. Null if there is none.
 */
export async function getLastDraw(supabase: Supabase, raffleId: string) {
  const { data } = await supabase
    .from("raffle_draws")
    .select("id, draw_number, winner_name")
    .eq("raffle_id", raffleId)
    .is("voided_at", null)
    .order("draw_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const card = await getWinnerCard(supabase, data.id);
  return { name: data.winner_name, number: data.draw_number, ...card };
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

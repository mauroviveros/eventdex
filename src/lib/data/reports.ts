import type { Supabase } from "@/lib/supabase/server";

/**
 * The reports' reads, for the team. Same rule as the overview: RLS decides what
 * each count includes, and nothing here names another stand.
 */

/**
 * One stand inside its event: visits, first stops, its place among the active
 * stands (null for an inactive one) and the average. Null when the stand does
 * not exist or is not readable.
 */
export async function getSpotReport(supabase: Supabase, eventSpotId: string) {
  const { data, error } = await supabase.rpc("spot_report", {
    p_event_spot_id: eventSpotId,
  });
  if (error) throw error;
  const r = data[0];
  if (!r) return null;
  return {
    eventId: r.event_id,
    visits: r.visits,
    firstStops: r.first_stops,
    // The database leaves the place null for an inactive stand.
    rank: (r.rank as number | null) ?? null,
    stands: r.stands,
    average: Number(r.average ?? 0),
  };
}

export type SpotReport = NonNullable<Awaited<ReturnType<typeof getSpotReport>>>;

/**
 * A stand's medals per hour of the event's zone, only the hours with any, in the
 * shape of the event's hours (no newcomers) so both chart the same way.
 */
export async function listSpotHours(supabase: Supabase, eventSpotId: string) {
  const { data, error } = await supabase.rpc("spot_hourly", {
    p_event_spot_id: eventSpotId,
  });
  if (error) throw error;
  return data.map((h) => ({ hour: h.hour, medals: h.medals, newcomers: 0 }));
}

/**
 * How each merit prize and draw of the event fared: what it asked, its cap, who
 * won and who reached it. Not the public list of prizes (`listEventPrizes` in
 * raffles.ts).
 */
export async function listPrizeOutcomes(supabase: Supabase, eventId: string) {
  const { data, error } = await supabase.rpc("event_prizes", {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data.flatMap((p) =>
    p.kind === "premio" || p.kind === "sorteo"
      ? [
          {
            kind: p.kind,
            id: p.id,
            title: p.title,
            needed: p.needed,
            slots: p.slots,
            winners: p.winners,
            reached: p.reached,
          },
        ]
      : [],
  );
}

export type PrizeOutcome = Awaited<
  ReturnType<typeof listPrizeOutcomes>
>[number];

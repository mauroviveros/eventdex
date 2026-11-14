/**
 * Medals: what a scan resulted in and how far the visitor's collection goes.
 * Instants stay ISO strings in UTC; the view formats them in the event's zone.
 */

/** The five outcomes of /s/[id]; the celebration has one screen for each. */
export type ClaimResult =
  | { kind: "nueva"; claimedAt: string }
  | { kind: "repetida"; claimedAt: string }
  | { kind: "inactivo" }
  /** `ended`: the event is over; otherwise it hasn't started yet. */
  | { kind: "fuera-de-fase"; startsAt: string; endsAt: string; ended: boolean }
  | { kind: "bloqueado" };

/** The row claim_spot() returns. */
type ClaimRow = {
  outcome: "new" | "repeat" | "inactive" | "out_of_phase" | "blocked";
  claimed_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

/**
 * claim_spot()'s row as a ClaimResult. The function always fills claimed_at for
 * new and repeat, and the dates for out_of_phase (a published event has
 * schedules); a row that breaks that is a bug, so it throws.
 */
export function toClaimResult(row: ClaimRow, now = new Date()): ClaimResult {
  const required = (value: string | null, field: string) => {
    if (!value)
      throw new Error(`claim_spot returned ${row.outcome} without ${field}`);
    return value;
  };
  switch (row.outcome) {
    case "new":
      return {
        kind: "nueva",
        claimedAt: required(row.claimed_at, "claimed_at"),
      };
    case "repeat":
      return {
        kind: "repetida",
        claimedAt: required(row.claimed_at, "claimed_at"),
      };
    case "inactive":
      return { kind: "inactivo" };
    case "out_of_phase": {
      const endsAt = required(row.ends_at, "ends_at");
      return {
        kind: "fuera-de-fase",
        startsAt: required(row.starts_at, "starts_at"),
        endsAt,
        ended: Date.parse(endsAt) < now.getTime(),
      };
    }
    case "blocked":
      return { kind: "bloqueado" };
  }
}

type CollectionSpot = { id: string; points: number };

/**
 * How much of the event's collection the visitor has: medals and points over
 * the spots passed in (the active ones). A medal of a spot deactivated later
 * stays in the visitor's collection but out of the progress.
 */
export function collectionProgress(
  spots: readonly CollectionSpot[],
  claimedSpotIds: Iterable<string>,
) {
  const claimed = new Set(claimedSpotIds);
  let medals = 0;
  let points = 0;
  let maxPoints = 0;
  for (const spot of spots) {
    maxPoints += spot.points;
    if (claimed.has(spot.id)) {
      medals += 1;
      points += spot.points;
    }
  }
  return { medals, total: spots.length, points, maxPoints };
}

/** How many missing stands the celebration names; the rest are counted. */
export const MISSING_SHOWN = 3;

/**
 * The stands the visitor has not scanned yet, for the celebration: the first
 * few in the event's order, and how many more there are.
 */
export function missingSpots<T extends { id: string }>(
  spots: readonly T[],
  claimedSpotIds: Iterable<string>,
  limit = MISSING_SHOWN,
) {
  const claimed = new Set(claimedSpotIds);
  const missing = spots.filter((s) => !claimed.has(s.id));
  return {
    shown: missing.slice(0, limit),
    more: Math.max(0, missing.length - limit),
  };
}

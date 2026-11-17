/**
 * The reports' figures, from the counts the database gives: a stand against the
 * audience and against the average of the event's stands, and how a prize fared.
 * Pure: the report of a stand never names another one.
 */

/** The share of the event's visitors who reached a stand (0 to 1), or null with nobody. */
export const shareOfAudience = (visits: number, visitors: number) =>
  visitors > 0 ? visits / visitors : null;

/** Visits over the stands' average (1 = on the average), or null when nobody scored. */
export const versusAverage = (visits: number, average: number) =>
  average > 0 ? visits / average : null;

/**
 * "3 de 12", or null for a stand with no place (inactive) or an event without
 * stands. No ordinal: the pixel font has no «º», and the cell is labelled «Puesto».
 */
export const placeLabel = (rank: number | null, stands: number) =>
  rank === null || stands <= 0 ? null : `${rank} de ${stands}`;

type Prize = { slots: number | null; winners: number; reached: number };

/** Slots nobody took, or null for a prize without a cap (everyone who arrives wins). */
export const unusedSlots = ({ slots, winners }: Prize) =>
  slots === null ? null : Math.max(0, slots - winners);

/**
 * Who reached the prize but did not get it: the cap ran out before them, or
 * (for a draw) they wait for the next one. Never negative.
 */
export const leftOut = ({ winners, reached }: Prize) =>
  Math.max(0, reached - winners);

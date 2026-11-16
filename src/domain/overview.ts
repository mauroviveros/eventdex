/**
 * The overview's figures, from the counts the database gives: the hours of each
 * schedule with the gaps filled, the funnel and whether there is enough to show.
 */

const HOUR = 3_600_000;

/** Below this many visitors the charts say "pocos datos" instead of a trend. */
export const FEW_VISITORS = 5;

type Schedule = { starts_at: string; ends_at: string };
export type HourCount = { hour: string; medals: number; newcomers: number };

/**
 * One row per hour of each schedule, in order, with zero where nothing happened.
 * Hours outside every schedule are left out: no medal is claimed then.
 */
export function hoursBySchedule(
  rows: readonly HourCount[],
  schedules: readonly Schedule[],
) {
  const byHour = new Map(rows.map((r) => [Date.parse(r.hour), r]));
  return [...schedules]
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
    .map((s) => {
      // shortcut: floors to the UTC hour, right for zones on whole hours (all of Argentina); a zone on :30 needs the event's offset
      const start = Math.floor(Date.parse(s.starts_at) / HOUR) * HOUR;
      const end = Date.parse(s.ends_at);
      const hours: HourCount[] = [];
      for (let t = start; t < end; t += HOUR) {
        const r = byHour.get(t);
        hours.push({
          hour: new Date(t).toISOString(),
          medals: r?.medals ?? 0,
          newcomers: r?.newcomers ?? 0,
        });
      }
      return { startsAt: s.starts_at, hours };
    });
}

type Counts = { visitors: number; half: number; complete: number };

/** Registered → half → all, each with its share of the registered (0 to 1). */
export function funnel({ visitors, half, complete }: Counts) {
  const share = (n: number) => (visitors > 0 ? n / visitors : 0);
  return [
    { step: "registrados", count: visitors, share: share(visitors) },
    { step: "mitad", count: half, share: share(half) },
    { step: "todas", count: complete, share: share(complete) },
  ] as const;
}

/** Medals per visitor, or null with nobody to divide by. */
export const medalsPerVisitor = (o: { visitors: number; medals: number }) =>
  o.visitors > 0 ? o.medals / o.visitors : null;

export type DataState = "vacio" | "pocos" | "listo";

/** Empty, too few to read a trend, or enough. */
export const dataState = (visitors: number): DataState =>
  visitors === 0 ? "vacio" : visitors < FEW_VISITORS ? "pocos" : "listo";

export const ACTIVITY_KINDS = ["medalla", "premio", "sorteo"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const isActivityKind = (kind: string): kind is ActivityKind =>
  (ACTIVITY_KINDS as readonly string[]).includes(kind);

/** Where a page of the activity starts: the last row of the previous one. */
export type ActivityCursor = { at: string; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The cursor of a row, for ?antes=. The instant goes as Postgres wrote it, to
 * the microsecond: through a Date it would round to the millisecond and the
 * next page could skip rows.
 */
export const activityCursor = ({ at, id }: ActivityCursor) => `${at}_${id}`;

/** The cursor in the URL, or null when it is missing or malformed (first page). */
export function parseActivityCursor(value: unknown): ActivityCursor | null {
  if (typeof value !== "string") return null;
  const cut = value.lastIndexOf("_");
  // A "+00:00" typed in a URL arrives as a space.
  const at = value.slice(0, cut).replace(/ (\d{2}:\d{2})$/, "+$1");
  const id = value.slice(cut + 1);
  if (cut < 1 || !UUID.test(id) || Number.isNaN(Date.parse(at))) return null;
  return { at, id };
}

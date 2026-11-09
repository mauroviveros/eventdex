/**
 * Event phase and dates. The phase is computed from the schedules, never
 * stored: from the first schedule's start to the last one's end, the same rule
 * as the event_phases view. Instants are UTC; the event's time zone is only for
 * showing and reading wall-clock times.
 */

export type Phase =
  | "borrador"
  | "proximo"
  | "en-curso"
  | "finalizado"
  | "sin-fecha";

export type Schedule = { starts_at: string; ends_at: string };

/** First start and last end, or null without schedules. */
export function scheduleRange(schedules: readonly Schedule[]) {
  if (schedules.length === 0) return null;
  let start = Number.POSITIVE_INFINITY;
  let end = Number.NEGATIVE_INFINITY;
  for (const s of schedules) {
    start = Math.min(start, Date.parse(s.starts_at));
    end = Math.max(end, Date.parse(s.ends_at));
  }
  return { start: new Date(start), end: new Date(end) };
}

/** Drafts are drafts whatever their dates; the rest goes by the schedules. */
export function eventPhase(
  status: string,
  schedules: readonly Schedule[],
  now = new Date(),
): Phase {
  if (status === "draft") return "borrador";
  const range = scheduleRange(schedules);
  if (!range) return "sin-fecha";
  if (now < range.start) return "proximo";
  if (now > range.end) return "finalizado";
  return "en-curso";
}

/**
 * "sáb, 14 nov", "sáb 14 al dom 15 de nov". The year shows only when the event
 * is not in the current one.
 */
export function formatEventDates(
  schedules: readonly Schedule[],
  timeZone: string,
  now = new Date(),
) {
  const range = scheduleRange(schedules);
  if (!range) return null;
  const year = (d: Date) =>
    new Intl.DateTimeFormat("es-AR", { year: "numeric", timeZone }).format(d);
  const thisYear =
    year(range.start) === year(now) && year(range.end) === year(now);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(thisYear ? {} : { year: "numeric" }),
    timeZone,
  }).formatRange(range.start, range.end);
}

/** "sáb, 14 nov, 15:32": one instant, in the event's time zone. */
export function formatMoment(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso));
}

/** "10:00 – 18:00" in the event's time zone. */
export function formatScheduleTimes(schedule: Schedule, timeZone: string) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatRange(new Date(schedule.starts_at), new Date(schedule.ends_at));
}

export function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Every zone to pick from, `current` included: it may be an alias Intl doesn't list (America/Argentina/Buenos_Aires). */
export function timeZoneOptions(current: string) {
  return [...new Set([current, ...Intl.supportedValuesOf("timeZone")])].sort();
}

/** The wall clock of `instant` in `timeZone`, read as if it were UTC (ms). */
function wallClock(instant: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(instant)
      .map((p) => [p.type, Number(p.value)]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
}

/**
 * A form's "2026-11-14T10:00" (no zone) read in the event's time zone, as a UTC
 * instant. Two passes settle the offset across a DST change.
 */
export function localToInstant(local: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) throw new RangeError(`Not a local date-time: ${local}`);
  const [y, mo, d, h, mi] = match.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
  ];
  const target = Date.UTC(y, mo - 1, d, h, mi);
  let guess = target - (wallClock(target, timeZone) - target);
  guess = target - (wallClock(guess, timeZone) - guess);
  return new Date(guess);
}

/** What the countdown shows: time to the next schedule, the one running now, or done. */
export type CountdownState =
  | { kind: "faltan"; days: number; hours: number; minutes: number }
  | { kind: "en-curso"; endsAt: string }
  | { kind: "finalizado" };

/**
 * The countdown for an event's schedules. During a schedule it ends at that
 * schedule's end (in the event's zone); between schedules or before the first
 * it counts down to the next start; after the last, finalizado.
 */
export function countdownState(
  schedules: readonly Schedule[],
  timeZone: string,
  now = new Date(),
): CountdownState {
  const t = now.getTime();
  const sorted = [...schedules].sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
  );
  const running = sorted.find(
    (s) => Date.parse(s.starts_at) <= t && t <= Date.parse(s.ends_at),
  );
  if (running) {
    return {
      kind: "en-curso",
      endsAt: new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone,
      }).format(new Date(running.ends_at)),
    };
  }
  const next = sorted.find((s) => Date.parse(s.starts_at) > t);
  if (!next) return { kind: "finalizado" };
  const minutes = Math.ceil((Date.parse(next.starts_at) - t) / 60_000);
  return {
    kind: "faltan",
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
  };
}

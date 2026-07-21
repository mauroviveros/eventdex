import { DateTime } from "luxon";

type ScheduleRow = { start_datetime: string; end_datetime: string };

/**
 * Rango total de un evento a partir de sus horarios: el inicio más temprano y
 * el fin más tardío. Null si el evento todavía no tiene horarios cargados.
 */
export function scheduleRange(
  schedules: ScheduleRow[],
): { start: string; end: string } | null {
  if (schedules.length === 0) return null;

  let start = schedules[0].start_datetime;
  let end = schedules[0].end_datetime;
  for (const schedule of schedules) {
    if (schedule.start_datetime < start) start = schedule.start_datetime;
    if (schedule.end_datetime > end) end = schedule.end_datetime;
  }
  return { start, end };
}

/**
 * Formatea el rango de fechas de un evento en su timezone, colapsando lo
 * redundante: "12–14 sept 2026" si comparte mes, "30 sept – 2 oct 2026" si no.
 */
export function formatDateRange(
  startIso: string,
  endIso: string,
  timezone: string,
  locale = "es-AR",
): string {
  const start = DateTime.fromISO(startIso, { zone: timezone }).setLocale(
    locale,
  );
  const end = DateTime.fromISO(endIso, { zone: timezone }).setLocale(locale);

  if (start.hasSame(end, "day")) return start.toFormat("d MMM yyyy");
  if (start.hasSame(end, "month")) {
    return `${start.toFormat("d")}–${end.toFormat("d MMM yyyy")}`;
  }
  if (start.hasSame(end, "year")) {
    return `${start.toFormat("d MMM")} – ${end.toFormat("d MMM yyyy")}`;
  }
  return `${start.toFormat("d MMM yyyy")} – ${end.toFormat("d MMM yyyy")}`;
}

/**
 * Convierte un valor de input `datetime-local` (sin zona) a un ISO UTC,
 * interpretándolo en el timezone del evento. Null si el valor no parsea.
 */
export function localToUtcIso(value: string, zone: string): string | null {
  const parsed = DateTime.fromISO(value, { zone });
  return parsed.isValid ? parsed.toUTC().toISO() : null;
}

/**
 * Convierte un ISO UTC al formato `datetime-local` (YYYY-MM-DDTHH:mm) en el
 * timezone del evento, para precargar inputs de edición.
 */
export function utcIsoToLocal(iso: string, zone: string): string {
  return DateTime.fromISO(iso, { zone: "utc" })
    .setZone(zone)
    .toFormat("yyyy-MM-dd'T'HH:mm");
}

/** Cuenta ocurrencias por clave; usado para agregar escaneos por evento. */
export function countBy<T>(rows: T[], key: (row: T) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

import { DateTime } from "luxon";

type ScanRow = { collected_at: string };
type ScheduleRow = { start_datetime: string; end_datetime: string };

/**
 * Días calendario (ISO, en el timezone del evento) que interesan en analytics:
 * la unión de los días con horario programado y los días con escaneos (los
 * escaneos de prueba previos al evento también cuentan como día).
 */
export function activityDays(
  scans: ScanRow[],
  schedules: ScheduleRow[],
  zone: string,
): string[] {
  const days = new Set<string>();

  for (const scan of scans) {
    const day = DateTime.fromISO(scan.collected_at).setZone(zone).toISODate();
    if (day) days.add(day);
  }

  for (const schedule of schedules) {
    let cursor = DateTime.fromISO(schedule.start_datetime)
      .setZone(zone)
      .startOf("day");
    const last = DateTime.fromISO(schedule.end_datetime)
      .setZone(zone)
      .startOf("day");
    while (cursor <= last) {
      const day = cursor.toISODate();
      if (day) days.add(day);
      cursor = cursor.plus({ days: 1 });
    }
  }

  return [...days].sort();
}

/**
 * Escaneos por hora de un día puntual, EN EL TIMEZONE DEL EVENTO, con las
 * horas intermedias rellenadas. `bounds` amplía el rango mostrado (p. ej. el
 * horario programado del evento) para que el gráfico encuadre la jornada
 * completa aunque haya horas sin escaneos.
 */
export function scansPerHour(
  scans: ScanRow[],
  zone: string,
  day: string,
  bounds?: { from: number; to: number },
): { hour: number; label: string; count: number }[] {
  const counts = new Map<number, number>();
  for (const scan of scans) {
    const scanned = DateTime.fromISO(scan.collected_at).setZone(zone);
    if (scanned.toISODate() !== day) continue;
    counts.set(scanned.hour, (counts.get(scanned.hour) ?? 0) + 1);
  }

  const candidates = [...counts.keys()];
  if (bounds) candidates.push(bounds.from, bounds.to);
  if (candidates.length === 0) return [];

  const from = Math.min(...candidates);
  const to = Math.max(...candidates);
  const result: { hour: number; label: string; count: number }[] = [];
  for (let hour = from; hour <= to; hour++) {
    result.push({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      count: counts.get(hour) ?? 0,
    });
  }
  return result;
}

/**
 * Rango horario programado que cae dentro de `day` (para encuadrar el gráfico
 * por hora). Null si ningún horario toca ese día.
 */
export function scheduleHourBounds(
  schedules: ScheduleRow[],
  zone: string,
  day: string,
): { from: number; to: number } | null {
  let from: number | null = null;
  let to: number | null = null;

  const dayStart = DateTime.fromISO(day, { zone }).startOf("day");
  const dayEnd = dayStart.endOf("day");

  for (const schedule of schedules) {
    const start = DateTime.fromISO(schedule.start_datetime).setZone(zone);
    const end = DateTime.fromISO(schedule.end_datetime).setZone(zone);
    if (end < dayStart || start > dayEnd) continue;

    const first = start < dayStart ? 0 : start.hour;
    const last = end > dayEnd ? 23 : end.hour;
    from = from === null ? first : Math.min(from, first);
    to = to === null ? last : Math.max(to, last);
  }

  return from === null || to === null ? null : { from, to };
}

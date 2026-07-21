import { DateTime } from "luxon";

/**
 * Agrupa escaneos por día calendario EN EL TIMEZONE DEL EVENTO (un escaneo a
 * las 23:30 hora local cuenta para ese día aunque en UTC sea el siguiente) y
 * rellena los días sin escaneos para que el gráfico de área no "salte".
 */
export function scansPerDay(
  rows: { collected_at: string }[],
  zone: string,
): { day: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const day = DateTime.fromISO(row.collected_at).setZone(zone).toISODate();
    if (!day) continue;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  const days = [...counts.keys()].sort();
  const last = DateTime.fromISO(days[days.length - 1], { zone });
  const result: { day: string; count: number }[] = [];
  let cursor = DateTime.fromISO(days[0], { zone });
  while (cursor <= last) {
    const day = cursor.toISODate();
    if (!day) break;
    result.push({ day, count: counts.get(day) ?? 0 });
    cursor = cursor.plus({ days: 1 });
  }
  return result;
}

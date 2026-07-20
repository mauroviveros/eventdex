import { DateTime } from "luxon";
import type { Tables } from "@/types";

type EventSchedule = Pick<
  Tables<"event_schedules">,
  "start_datetime" | "end_datetime"
>;

export function resolveScheduleDateTime(value: string) {
  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(value);
  return DateTime.fromISO(hasTimezone ? value : `${value}Z`);
}

export function isScheduleActive(
  schedule: EventSchedule,
  now = DateTime.utc(),
) {
  const start = resolveScheduleDateTime(schedule.start_datetime);
  const end = resolveScheduleDateTime(schedule.end_datetime);

  return start <= now && now <= end;
}

/**
 * Etiqueta legible del horario, formateada en la zona horaria del evento.
 *
 * Recibe `timezone` explícito (columna `events.timezone`) en vez de depender de
 * la zona del visitante: para un evento presencial todos deben ver la hora local
 * del evento, y así el formateo es determinístico (habilita render estático).
 */
export function formatScheduleLabel(schedule: EventSchedule, timezone: string) {
  const start = resolveScheduleDateTime(schedule.start_datetime)
    .setZone(timezone)
    .setLocale("es-AR");
  const end = resolveScheduleDateTime(schedule.end_datetime)
    .setZone(timezone)
    .setLocale("es-AR");

  // Día (ej: Domingo 5 de abril)
  const day = start.toFormat("cccc d 'de' LLLL");
  // Horas (ej: 20:00hs a 01:00hs)
  const hours = `${start.toFormat("HH:mm")}hs a ${end.toFormat("HH:mm")}hs`;
  // Zona como offset numérico (ej: GMT-3), inequívoco desde cualquier huso.
  const zone = formatUtcOffset(start.offset);

  return `${capitalize(day)} · ${hours} (${zone})`;
}

/** Convierte un offset en minutos a una etiqueta legible: 0→"UTC", -180→"GMT-3". */
function formatUtcOffset(offsetMinutes: number) {
  if (offsetMinutes === 0) return "UTC";

  const sign = offsetMinutes > 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;

  return minutes === 0
    ? `GMT${sign}${hours}`
    : `GMT${sign}${hours}:${String(minutes).padStart(2, "0")}`;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

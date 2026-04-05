import { Tables } from "@/types";
import { DateTime } from "luxon";

type EventSchedule = Pick<Tables<"event_schedules">, "start_datetime" | "end_datetime">

export function resolveScheduleDateTime(value: string) {
  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(value);
  return DateTime.fromISO(hasTimezone ? value : `${value}Z`);
}

export function isScheduleActive(schedule: EventSchedule, now = DateTime.utc()) {
  const start = resolveScheduleDateTime(schedule.start_datetime);
  const end = resolveScheduleDateTime(schedule.end_datetime);

  return start <= now && now <= end;
}

export function formatScheduleLabel(schedule: EventSchedule) {
  const start = resolveScheduleDateTime(schedule.start_datetime)
  const end = resolveScheduleDateTime(schedule.end_datetime)

  // Día (ej: Domingo 5 de Abril)
  const day = start.toFormat("cccc d 'de' LLLL");
  // Horas (20:00 a 01:00)
  const hours = `${start.toFormat("HH:mm")} a ${end.toFormat("HH:mm")}`;

  return `${capitalize(day)} · ${hours}`;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

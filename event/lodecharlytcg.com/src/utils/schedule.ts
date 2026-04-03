import { Tables } from "@/types";
import { DateTime } from "luxon";

type EventSchedule = Pick<Tables<"event_schedules">, "start_datetime" | "end_datetime">

export function formatScheduleLabel(schedule: EventSchedule) {
  const zone = "America/Argentina/Buenos_Aires";
  const locale = "es-AR";

  const start = DateTime.fromISO(schedule.start_datetime).setZone(zone);
  const end = DateTime.fromISO(schedule.end_datetime).setZone(zone);

  // Día (ej: Domingo 5 de Abril)
  const day = start.setLocale(locale).toFormat("cccc d 'de' LLLL");
  // Horas (20:00 a 01:00)
  const hours = `${start.toFormat("HH:mm")} a ${end.toFormat("HH:mm")}`;

  return `${capitalize(day)} · ${hours}`;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

import { Tables } from "@/types"

type EventSchedule = Pick<Tables<"event_schedules">, "start_datetime" | "end_datetime">

const resolveDate = (value: string | Date) => {
  return value instanceof Date ? value : new Date(value)
}

const capitalize = (value: string) => {
  if (!value) return value
  return `${value[0].toUpperCase()}${value.slice(1)}`
}

const formatScheduleTimeRange = (schedule: EventSchedule) => {
  const timeFormatter = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })

  const start = timeFormatter.format(resolveDate(schedule.start_datetime))
  const end = timeFormatter.format(resolveDate(schedule.end_datetime))

  return `${start} a ${end}`
}

const formatScheduleDate = (value: string | Date) => {
  const date = resolveDate(value)

  const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(date)
  const day = new Intl.DateTimeFormat("es-AR", { day: "numeric" }).format(date)
  const month = new Intl.DateTimeFormat("es-AR", { month: "long" }).format(date)

  return `${capitalize(weekday)} ${day} de ${capitalize(month)}`
}

export const formatScheduleLabel = (schedules: EventSchedule[]) => {
  if (schedules.length !== 1) return null
  const [schedule] = schedules
  const start = resolveDate(schedule.start_datetime)
  return `${formatScheduleDate(start)} · ${formatScheduleTimeRange(schedule)}`
}

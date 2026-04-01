"use client"

import { useCountdown } from "@/hooks/useCountdown"
import { Tables } from "@/types"
import { useMemo } from "react"
import { Card, CardContent } from "./ui/card"

export const Countdown = ({ start_datetime }: { start_datetime: Tables<"event_schedules">["start_datetime"] }) => {
  const targetMS = useMemo(() => new Date(start_datetime).getTime(), [start_datetime])
  const { days, hours, minutes, seconds } = useCountdown(targetMS)
  const units = useMemo(
    () => [
      { label: "Días", value: days.toString().padStart(2, "0") },
      { label: "Horas", value: hours.toString().padStart(2, "0") },
      { label: "Minutos", value: minutes.toString().padStart(2, "0") },
      { label: "Segundos", value: seconds.toString().padStart(2, "0") },
    ],
    [days, hours, minutes, seconds],
  )

  return (
    <article className="space-y-2">
      <h2 className="text-center text-3xl">Próximamente...</h2>

      <div className="flex gap-4">
        {units.map(({ label, value }) => (
          <Card className="p-1" key={label}>
            <CardContent className="flex flex-col items-center justify-center p-0 size-16">
              <span className="font-press-start text-2xl">{value}</span>
              <span className="text-lg text-muted-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </article>
  )
}

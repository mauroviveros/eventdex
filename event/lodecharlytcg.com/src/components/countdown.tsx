"use client";
import { useCountdown } from "@/hooks/useCountdown";
import { Card, CardContent } from "./ui/card"

export const Countdown = () => {
  const targetMS = new Date('2026-03-31').getTime();
  const { days, hours, minutes, seconds } = useCountdown(targetMS);

  return (
    <article className="space-y-2">
      <h2 className="text-center text-3xl">Proximamente...</h2>

      <div className="flex gap-4">
        {[
          { label: "Días", value: days.toString().padStart(2, "0") },
          { label: "Horas", value: hours.toString().padStart(2, "0") },
          { label: "Minutos", value: minutes.toString().padStart(2, "0") },
          { label: "Segundos", value: seconds.toString().padStart(2, "0") },
        ].map(({ label, value }) => (
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

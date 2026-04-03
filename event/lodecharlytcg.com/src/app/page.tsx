import { Countdown } from "@/components/countdown";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/libs/supabase/client";
import { formatScheduleLabel } from "@/utils";
import { Clock } from "@nsmr/pixelart-react";
import { useMemo } from "react";

export default async function Home() {
  const supabase = useMemo(() => createClient(), []);
  const { data: event } = await supabase
    .from("events")
    .select(`
      *,
      location:event_locations(*),
      schedules:event_schedules(*)
    `)
    .eq('slug', 'lodecharlytcg.com')
    .single()

  const config = (event?.config || {}) as Record<string, string>;

  return (
    <section className="flex-1 min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-2 py-8 gap-8">
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        <Card size="sm" className="mx-4">
          <CardContent className="flex items-center gap-2">
            <Clock className="text-muted-foreground size-5" />
            <span className="text-xl text-accent">{formatScheduleLabel(event?.schedules || [])}</span>
          </CardContent>
        </Card>

        <Card className="highlight z-10">
          <CardContent className="font-press-start text-center space-y-1 px-2">
            <h1 className="text-3xl text-secondary text-balance">{config?.title}</h1>
            <p className="text-xs text-muted-foreground text-pretty">{config?.description}</p>
          </CardContent>
        </Card>

        <Card size="sm" className="mx-4">
          <CardContent>
            <h3 className="text-xl text-accent">{event?.location?.name}</h3>
            <p className="text-muted-foreground">{event?.location?.address}</p>
          </CardContent>
        </Card>
      </div>

      {event?.schedules?.[0]?.start_datetime && (
        <Countdown start_datetime={event.schedules[0].start_datetime} initial={Date.now()} />
      )}
    </section>
  )
}

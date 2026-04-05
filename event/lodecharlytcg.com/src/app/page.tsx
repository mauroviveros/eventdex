import { Countdown } from "@/components/countdown";
import { Card, CardContent } from "@/components/ui/card";
import { SITE_SLUG } from "@/constants";
import { createClient } from "@/libs/supabase/server";
import { cn, formatScheduleLabel } from "@/utils";
import { Clock } from "@nsmr/pixelart-react";
import { DateTime } from "luxon";
import { cookies } from "next/headers";

function RankingSkeleton() {
  return (
    <Card size="sm" className="my-4">
      <CardContent className="space-y-3 py-4">
        <div className="h-6 w-40 animate-pulse rounded bg-muted/40" />
        <div className="h-24 w-full animate-pulse rounded bg-muted/40" />
        <div className="h-24 w-full animate-pulse rounded bg-muted/40" />
      </CardContent>
    </Card>
  );
}

export default async function Home() {
  const supabase = await createClient(await cookies());
  const { data: event } = await supabase
    .from("events")
    .select(`*, location:event_locations(*), schedules:event_schedules(*)`)
    .eq('slug', SITE_SLUG)
    .single()

  if (!event || !event.location || !event.schedules || event.schedules.length === 0) return null

  const config = (event?.config || {}) as Record<string, string>;
  const startDateTime = DateTime.fromISO(event.schedules[0].start_datetime);
  const hasEventStarted = startDateTime <= DateTime.now();

  return (
    <>
      <section
        className={cn([
          "flex-1 flex flex-col items-center justify-center px-2 py-8 gap-8",
          hasEventStarted ? "min-h-[calc(85dvh-5rem)]" : "min-h-[calc(100dvh-5rem)]",
        ])}
      >
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <Card size="sm" className="mx-4">
            <CardContent className="flex items-center gap-2">
              <Clock className="text-muted-foreground size-5" />
              <span className="text-xl text-accent">{formatScheduleLabel(event?.schedules[0])}</span>
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

        {!hasEventStarted && (
          <Countdown start_datetime={event.schedules[0].start_datetime} initial={DateTime.now().toMillis()} />
        )}
      </section>
      {/* {hasEventStarted && (
        <div className="w-full max-w-3xl mx-auto px-4">
          <Suspense fallback={<RankingSkeleton />}>
            <Ranking />
          </Suspense>
        </div>
      )} */}
    </>
  )
}

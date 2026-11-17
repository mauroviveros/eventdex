import Link from "next/link";
import {
  ActivityFeed,
  EmptyOverview,
  FewDataNote,
  FunnelBars,
  HoursBySchedule,
  HoursLegend,
  overviewCells,
  PrizeOutcomes,
  SpotRanking,
  Tile,
} from "@/components/panel/Overview";
import { StatStrip } from "@/components/panel/StatStrip";
import { buttonClass } from "@/components/ui/Button";
import { dataState, type HourCount } from "@/domain/overview";
import type { Activity, EventOverview, RankedSpot } from "@/lib/data/overview";
import type { PrizeOutcome } from "@/lib/data/reports";

type Props = {
  /** The event's own path: the reports hang from `/informe`. */
  base: string;
  prizes: PrizeOutcome[];
  /** Where "Ver toda la actividad" goes: the Actividad view filtered by this event. */
  activityHref: string;
  timeZone: string;
  overview: EventOverview;
  days: { startsAt: string; hours: HourCount[] }[];
  ranking: RankedSpot[];
  activity: Activity[];
  /** The current hour (ISO), while the event runs. */
  now?: string;
};

/**
 * The event while it runs, in the same tiles as the org's Resumen: the
 * figures, the hours beside the stands, then how far visitors get and the
 * latest activity.
 */
export function ResumenTab({
  base,
  prizes,
  activityHref,
  timeZone,
  overview,
  days,
  ranking,
  activity,
  now,
}: Props) {
  const state = dataState(overview.visitors);
  if (state === "vacio") return <EmptyOverview />;
  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Link
          href={`${base}/informe`}
          className={buttonClass("secondary", "no-underline")}
        >
          Informe del evento
        </Link>
      </div>
      <StatStrip cells={overviewCells(overview)} />
      {state === "pocos" && <FewDataNote />}
      <div className="grid gap-4 lg:grid-cols-3">
        <Tile
          id="afluencia"
          title="Afluencia"
          aside={<HoursLegend />}
          className="lg:col-span-2"
        >
          <HoursBySchedule days={days} timeZone={timeZone} now={now} />
        </Tile>
        <Tile id="stands" title="Stands">
          <SpotRanking
            spots={ranking}
            average
            reportHref={(code) => `${base}/informe/${encodeURIComponent(code)}`}
          />
        </Tile>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Tile id="embudo" title="Hasta dónde llegan">
          <FunnelBars overview={overview} />
        </Tile>
        <Tile
          id="actividad"
          title="Actividad"
          aside={
            <Link href={activityHref} className="font-display text-px-1">
              Ver toda la actividad
            </Link>
          }
        >
          <ActivityFeed items={activity} timeZone={timeZone} />
        </Tile>
      </div>
      <Tile id="premios" title="Premios y sorteos">
        <PrizeOutcomes prizes={prizes} />
      </Tile>
    </div>
  );
}

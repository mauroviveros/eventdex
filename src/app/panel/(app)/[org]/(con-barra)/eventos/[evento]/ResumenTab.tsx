import {
  ActivityFeed,
  EmptyOverview,
  FewDataNote,
  FunnelBars,
  HoursBySchedule,
  OverviewSection,
  overviewCells,
  SpotRanking,
} from "@/components/panel/Overview";
import { StatStrip } from "@/components/panel/StatStrip";
import { dataState, type HourCount } from "@/domain/overview";
import type { Activity, EventOverview, RankedSpot } from "@/lib/data/overview";

type Props = {
  timeZone: string;
  overview: EventOverview;
  days: { startsAt: string; hours: HourCount[] }[];
  ranking: RankedSpot[];
  activity: Activity[];
  /** The current hour (ISO), while the event runs. */
  now?: string;
};

/**
 * The event while it runs, read from a phone: the figures, the hours, how far
 * visitors get and which stands draw them; on a wide screen, what just
 * happened beside it.
 */
export function ResumenTab({
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
    <div className="grid gap-12">
      <StatStrip cells={overviewCells(overview)} />
      {state === "pocos" && <FewDataNote />}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-12">
          <OverviewSection id="afluencia" title="Afluencia">
            <HoursBySchedule days={days} timeZone={timeZone} now={now} />
          </OverviewSection>
          <OverviewSection id="embudo" title="Hasta dónde llegan">
            <FunnelBars overview={overview} />
          </OverviewSection>
          <OverviewSection id="stands" title="Stands">
            <SpotRanking spots={ranking} />
          </OverviewSection>
        </div>
        <OverviewSection id="actividad" title="Actividad">
          <ActivityFeed items={activity} timeZone={timeZone} />
        </OverviewSection>
      </div>
    </div>
  );
}

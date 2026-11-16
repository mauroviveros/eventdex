import type { Metadata } from "next";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import {
  DEFAULT_TIME_ZONE,
  eventPhase,
  formatEventDates,
} from "@/domain/events";
import { hoursBySchedule } from "@/domain/overview";
import { listEvents } from "@/lib/data/events";
import {
  getEventOverview,
  getOrgOverview,
  listActivity,
  listEventHours,
  listSpotRanking,
} from "@/lib/data/overview";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { ResumenBento } from "./ResumenBento";

export async function generateMetadata({
  params,
}: PageProps<"/panel/[org]">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Resumen · ${org.name}` };
}

const lastEnd = (s: readonly { ends_at: string }[]) =>
  Math.max(0, ...s.map((x) => Date.parse(x.ends_at)));

/**
 * The organization's home: the event of the moment (the one in course or, if
 * none, the last one that ended) with its hours and stands, the latest
 * activity, the audience and what comes next.
 */
export default async function ResumenPage({
  params,
}: PageProps<"/panel/[org]">) {
  const { org, support } = await requireOrg((await params).org);
  const supabase = await createClient();
  const now = new Date();

  const [events, audience, activity] = await Promise.all([
    listEvents(supabase, org.id),
    getOrgOverview(supabase, org.id),
    listActivity(supabase, org.id, { limit: 6 }),
  ]);
  const withPhase = events.map((e) => ({
    ...e,
    phase: eventPhase(e.status, e.schedules, now),
  }));
  const featured =
    withPhase.find((e) => e.phase === "en-curso") ??
    withPhase
      .filter((e) => e.phase === "finalizado")
      .sort((a, b) => lastEnd(b.schedules) - lastEnd(a.schedules))[0] ??
    null;

  const [overview, hours, ranking] = featured
    ? await Promise.all([
        getEventOverview(supabase, featured.id),
        listEventHours(supabase, featured.id),
        listSpotRanking(supabase, featured.id),
      ])
    : [null, [], []];

  // The day to chart: today's while it runs, else the last one with medals.
  const hourNow = Math.floor(now.getTime() / 3_600_000) * 3_600_000;
  const days = featured ? hoursBySchedule(hours, featured.schedules) : [];
  const today = days.find((d) =>
    d.hours.some((h) => Date.parse(h.hour) === hourNow),
  );
  const day =
    today ??
    days.findLast((d) => d.hours.some((h) => h.medals > 0)) ??
    days.at(-1) ??
    null;

  const next = withPhase
    .filter((e) => e.phase === "proximo" || e.phase === "borrador")
    .slice(0, 3)
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      phase: e.phase,
      dates: formatEventDates(e.schedules, e.timezone, now),
    }));

  return (
    <>
      <TopBar title="Resumen" />
      <PageBody>
        <ResumenBento
          org={org.slug}
          support={support}
          audience={audience}
          featured={
            featured && overview
              ? {
                  slug: featured.slug,
                  title: featured.title,
                  edition: featured.edition_label,
                  phase: featured.phase,
                  dates: formatEventDates(
                    featured.schedules,
                    featured.timezone,
                    now,
                  ),
                  timeZone: featured.timezone,
                  overview,
                  day,
                  today: today !== undefined,
                  ranking,
                }
              : null
          }
          activity={activity}
          titles={new Map(events.map((e) => [e.id, e.title]))}
          timeZone={events[0]?.timezone ?? DEFAULT_TIME_ZONE}
          next={next}
          now={
            featured?.phase === "en-curso"
              ? new Date(hourNow).toISOString()
              : undefined
          }
        />
      </PageBody>
    </>
  );
}

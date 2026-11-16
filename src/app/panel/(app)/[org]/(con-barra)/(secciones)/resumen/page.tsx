import type { Metadata } from "next";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { eventPhase, formatEventDates } from "@/domain/events";
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
import { ALTS, ResumenBento } from "./ResumenBento";

export async function generateMetadata({
  params,
}: PageProps<"/panel/[org]/resumen">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Resumen · ${org.name}` };
}

const lastEnd = (s: readonly { ends_at: string }[]) =>
  Math.max(0, ...s.map((x) => Date.parse(x.ends_at)));

/**
 * The organization at a glance: its audience, the event of the moment (the
 * one in course or, if none, the last one that ended) with its hours and
 * stands, the latest activity and what comes next.
 */
export default async function ResumenPage({
  params,
  searchParams,
}: PageProps<"/panel/[org]/resumen">) {
  const { org } = await requireOrg((await params).org);
  const { alt } = await searchParams;
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
  const day =
    days.find((d) => d.hours.some((h) => Date.parse(h.hour) === hourNow)) ??
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
          alt={ALTS.find((a) => a === alt) ?? "a"}
          audience={audience}
          live={withPhase.filter((e) => e.phase === "en-curso").length}
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
                  ranking,
                }
              : null
          }
          activity={activity}
          titles={new Map(events.map((e) => [e.id, e.title]))}
          timeZone={events[0]?.timezone ?? "America/Argentina/Buenos_Aires"}
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

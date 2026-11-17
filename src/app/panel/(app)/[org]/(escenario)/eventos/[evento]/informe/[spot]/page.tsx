import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ReportBar } from "@/components/panel/ReportBar";
import { SpotReportSheet } from "@/components/panel/ReportSheet";
import { eventPhase, formatEventDates } from "@/domain/events";
import { hoursBySchedule } from "@/domain/overview";
import { orgRamp } from "@/domain/palette";
import { getEventBySlug } from "@/lib/data/events";
import { getEventOverview, listEventHours } from "@/lib/data/overview";
import { getSpotReport, listSpotHours } from "@/lib/data/reports";
import { listEventSpots } from "@/lib/data/spots";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Informe de un stand",
  robots: { index: false },
};

/**
 * A stand's report, for its sponsor: how many came, when, how it did against the
 * average of the stands, and how many started their tour there. It never names
 * another stand or a visitor. `[spot]` is the stand's code in the event. Same
 * rules as the event's report: the team only, a 404 for a draft.
 */
export default async function SpotReportPage({
  params,
}: PageProps<"/panel/[org]/eventos/[evento]/informe/[spot]">) {
  const { org: slug, evento, spot: code } = await params;
  const { org } = await requireOrg(slug);
  const supabase = await createClient();
  const event = await getEventBySlug(supabase, org.id, evento);
  if (!event || event.status === "draft") notFound();

  const spots = await listEventSpots(supabase, event.id);
  const stand = spots.find(
    (s) => s.code.toLowerCase() === decodeURIComponent(code).toLowerCase(),
  );
  if (!stand) notFound();

  const [report, spotHours, overview, hours] = await Promise.all([
    getSpotReport(supabase, stand.id),
    listSpotHours(supabase, stand.id),
    getEventOverview(supabase, event.id),
    listEventHours(supabase, event.id),
  ]);
  if (!report) notFound();

  const base = `/panel/${org.slug}/eventos/${event.slug}`;
  const now = new Date();
  const cut = {
    at: new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: event.timezone,
    }).format(now),
    partial: eventPhase(event.status, event.schedules, now) !== "finalizado",
  };
  const style = Object.fromEntries(
    orgRamp(org.brand_color).map((tone, i) => [`--ramp-${i}`, tone]),
  ) as CSSProperties;

  return (
    <>
      <style>{"@page { size: A4; margin: 10mm; }"}</style>
      <ReportBar back={base} />
      <div
        style={style}
        // Paper is light: the screen shows what the print will.
        data-scheme="light"
        className="ramp-scope min-h-dvh bg-lcd-0 px-4 py-6 text-lcd-3 print:p-0"
      >
        {report.visits === 0 ? (
          <section className="mx-auto grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8 print:hidden">
            <h1 className="text-px-2">Este stand todavía no tiene medallas</h1>
            <p>
              El informe se arma con las medallas de su stand. Cuando alguien
              escanee su QR, lo vas a poder imprimir desde acá.
            </p>
          </section>
        ) : (
          <SpotReportSheet
            head={{
              kind: "Informe de stand",
              orgName: org.name,
              logoPath: org.logo_path,
              title: stand.shown.name,
              subtitle: event.edition_label
                ? `${event.title} ${event.edition_label}`
                : event.title,
              dates: formatEventDates(event.schedules, event.timezone),
              venue: event.venue?.name ?? null,
            }}
            cut={cut}
            timeZone={event.timezone}
            visitors={overview.visitors}
            spot={report}
            days={hoursBySchedule(hours, event.schedules)}
            spotHours={spotHours}
          />
        )}
      </div>
    </>
  );
}

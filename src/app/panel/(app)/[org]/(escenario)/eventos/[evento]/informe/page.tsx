import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ReportBar } from "@/components/panel/ReportBar";
import { EventReport } from "@/components/panel/ReportSheet";
import { eventPhase, formatEventDates } from "@/domain/events";
import { hoursBySchedule } from "@/domain/overview";
import { orgRamp } from "@/domain/palette";
import { getEventBySlug } from "@/lib/data/events";
import {
  getEventOverview,
  getOrgOverview,
  listEventHours,
} from "@/lib/data/overview";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Informe del evento",
  robots: { index: false },
};

/**
 * The event's report, to hand to a sponsor who might come in: the figures, the
 * hours of each day and how many return. One A4, in the org's palette, printed
 * with «Guardar como PDF». For the team (and a developer in support): RLS lets
 * in nobody else. A draft has no data, so it is a 404.
 */
export default async function EventReportPage({
  params,
}: PageProps<"/panel/[org]/eventos/[evento]/informe">) {
  const { org: slug, evento } = await params;
  const { org } = await requireOrg(slug);
  const supabase = await createClient();
  const event = await getEventBySlug(supabase, org.id, evento);
  if (!event || event.status === "draft") notFound();

  const [overview, hours, audience] = await Promise.all([
    getEventOverview(supabase, event.id),
    listEventHours(supabase, event.id),
    getOrgOverview(supabase, org.id),
  ]);

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
        {overview.medals === 0 ? (
          <section className="mx-auto grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8 print:hidden">
            <h1 className="text-px-2">Todavía no hay nada para informar</h1>
            <p>
              El informe se arma con las medallas del evento. Cuando haya
              visitantes, lo vas a poder imprimir desde acá.
            </p>
          </section>
        ) : (
          <EventReport
            head={{
              kind: "Informe del evento",
              orgName: org.name,
              logoPath: org.logo_path,
              title: event.edition_label
                ? `${event.title} ${event.edition_label}`
                : event.title,
              dates: formatEventDates(event.schedules, event.timezone),
              venue: event.venue?.name ?? null,
            }}
            cut={cut}
            timeZone={event.timezone}
            overview={overview}
            days={hoursBySchedule(hours, event.schedules)}
            audience={audience}
          />
        )}
      </div>
    </>
  );
}

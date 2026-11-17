import type { Metadata } from "next";
import Link from "next/link";
import { EditSheet } from "@/components/panel/EditSheet";
import { EventActions } from "@/components/panel/EventActions";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import { eventPhase, formatEventDates } from "@/domain/events";
import { hoursBySchedule } from "@/domain/overview";
import { listAwardWinners, listEventAwards } from "@/lib/data/awards";
import { listEventVisitors } from "@/lib/data/claims";
import { listVenues } from "@/lib/data/events";
import {
  getEventOverview,
  listActivity,
  listEventHours,
  listSpotRanking,
} from "@/lib/data/overview";
import { listEventRaffles } from "@/lib/data/raffles";
import { listPrizeOutcomes } from "@/lib/data/reports";
import { listEventSpots, listSpots } from "@/lib/data/spots";
import { createClient } from "@/lib/supabase/server";
import { EventTabs } from "./EventTabs";
import { load } from "./load";
import { PageTab } from "./PageTab";
import { EVENT_TABS } from "./query";
import { RaffleTab } from "./RaffleTab";
import { ResumenTab } from "./ResumenTab";
import { EventDataForm, VenueForm } from "./ScheduleForms";
import { SpotsTab } from "./SpotsTab";
import { VisitorsTab } from "./VisitorsTab";

export async function generateMetadata({
  params,
}: PageProps<"/panel/[org]/eventos/[evento]">): Promise<Metadata> {
  const { org: slug, evento } = await params;
  const { org, event } = await load(slug, evento);
  return { title: `${event.title} · ${org.name}` };
}

/**
 * One event, in tabs (?tab=): Resumen (how it goes; the home of a published
 * event), Página (publishing, schedules and what its public page shows; the
 * home of a draft), Spots, Visitantes and Sorteo.
 * The print sheet keeps its own page: it goes to paper.
 */
export default async function EventoPage({
  params,
  searchParams,
}: PageProps<"/panel/[org]/eventos/[evento]">) {
  const { org: slug, evento } = await params;
  const query = await searchParams;
  const { org, support, event } = await load(slug, evento);
  const phase = eventPhase(event.status, event.schedules);
  const draft = event.status === "draft";
  // A draft has no medals yet: no Resumen, and it opens on Página.
  const tabs = draft ? EVENT_TABS.filter((t) => t !== "resumen") : EVENT_TABS;
  const home = draft ? "pagina" : "resumen";
  const tab = tabs.find((t) => t === query.tab) ?? home;
  const editable = !support;
  const supabase = await createClient();
  // Spots and visitors feed the tab counts; the catalog only the Spots tab,
  // the venues only the Editar sheet.
  const [
    inEvent,
    visitors,
    catalog,
    venues,
    raffles,
    awards,
    winners,
    resumen,
  ] = await Promise.all([
    listEventSpots(supabase, event.id),
    listEventVisitors(supabase, event.id),
    editable && tab === "spots" ? listSpots(supabase, org.id) : [],
    editable ? listVenues(supabase, org.id) : [],
    // Each raffle counts its eligible visitors: only on its own tab.
    tab === "sorteo" ? listEventRaffles(supabase, event.id) : [],
    tab === "sorteo" ? listEventAwards(supabase, event.id) : [],
    tab === "sorteo" ? listAwardWinners(supabase, event.id) : [],
    tab === "resumen"
      ? Promise.all([
          getEventOverview(supabase, event.id),
          listEventHours(supabase, event.id),
          listSpotRanking(supabase, event.id),
          listActivity(supabase, org.id, { eventId: event.id, limit: 6 }),
          listPrizeOutcomes(supabase, event.id),
        ])
      : null,
  ]);
  // shortcut: floors to the UTC hour like hoursBySchedule, right for zones on whole hours
  const now =
    phase === "en-curso"
      ? new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString()
      : undefined;

  return (
    <>
      <TopBar
        title={event.title}
        crumbs={[{ label: "Eventos", href: `/panel/${org.slug}/eventos` }]}
        actions={
          <>
            {editable && (
              <EditSheet
                label="Editar"
                ariaLabel={`Editar ${event.title}`}
                title={`Editar ${event.title}`}
                description="Datos y sede del evento. Las jornadas se editan desde la pestaña Página."
              >
                <EventDataForm
                  org={org.slug}
                  event={{
                    id: event.id,
                    title: event.title,
                    editionLabel: event.edition_label,
                    summary: event.summary,
                  }}
                />
                <section aria-labelledby="sede" className="grid gap-4">
                  <h3 id="sede" className="text-px-2">
                    Sede
                  </h3>
                  {venues.length === 0 ? (
                    <p className="border-2 border-dashed border-lcd-2 px-4 py-6">
                      Todavía no cargaste sedes.{" "}
                      <Link
                        href={`/panel/${org.slug}/sedes`}
                        className="underline"
                      >
                        Cargá una
                      </Link>{" "}
                      y volvé para elegirla.
                    </p>
                  ) : (
                    <VenueForm
                      org={org.slug}
                      eventId={event.id}
                      venueId={event.venue_id}
                      venues={venues}
                      hasSchedules={event.schedules.length > 0}
                    />
                  )}
                </section>
              </EditSheet>
            )}
            <EventActions
              org={org.slug}
              event={{
                id: event.id,
                slug: event.slug,
                title: event.title,
                draft,
              }}
              hasSpots={inEvent.length > 0}
              ready={event.schedules.length > 0}
              support={support}
            />
          </>
        }
      />
      <PageBody>
        <header className="grid gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-px-3 text-balance sm:text-px-4">
              {event.title}
              {event.edition_label && (
                <span className="text-muted-foreground">
                  {" "}
                  {event.edition_label}
                </span>
              )}
            </h1>
            <PhaseBadge phase={phase} />
          </div>
          <p className="text-muted-foreground">
            {[
              formatEventDates(event.schedules, event.timezone) ?? "Sin fecha",
              event.venue?.name ?? "Sin sede",
            ].join(" · ")}
          </p>
          {event.summary && <p className="max-w-prose">{event.summary}</p>}
        </header>

        <EventTabs
          tabs={tabs}
          home={home}
          value={tab}
          counts={{ spots: inEvent.length, visitantes: visitors.length }}
        >
          {resumen ? (
            <ResumenTab
              activityHref={`/panel/${org.slug}/actividad?evento=${event.slug}`}
              timeZone={event.timezone}
              overview={resumen[0]}
              days={hoursBySchedule(resumen[1], event.schedules)}
              ranking={resumen[2]}
              base={`/panel/${org.slug}/eventos/${event.slug}`}
              prizes={resumen[4]}
              activity={resumen[3]}
              now={now}
            />
          ) : tab === "spots" ? (
            <SpotsTab
              org={org.slug}
              eventId={event.id}
              support={support}
              inEvent={inEvent}
              catalog={catalog}
              params={query}
            />
          ) : tab === "sorteo" ? (
            <RaffleTab
              org={org}
              eventId={event.id}
              eventSlug={event.slug}
              timezone={event.timezone}
              raffles={raffles}
              awards={awards}
              winners={winners}
              totalSpots={inEvent.filter((s) => s.is_active).length}
              support={support}
            />
          ) : tab === "visitantes" ? (
            <VisitorsTab
              org={org.slug}
              support={support}
              timezone={event.timezone}
              visitors={visitors}
              params={query}
            />
          ) : (
            <PageTab
              org={org}
              event={event}
              support={support}
              hasSpots={inEvent.length > 0}
            />
          )}
        </EventTabs>
      </PageBody>
    </>
  );
}

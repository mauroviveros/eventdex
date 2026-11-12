import type { Metadata } from "next";
import Link from "next/link";
import { EditSheet } from "@/components/admin/EditSheet";
import { EventActions } from "@/components/admin/EventActions";
import { StatTile } from "@/components/admin/StatTile";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { EventCover } from "@/components/visitante/EventHome";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import {
  eventPhase,
  formatEventDates,
  formatScheduleTimes,
} from "@/domain/events";
import { publicOrigin } from "@/domain/spots";
import { deleteScheduleAction } from "@/lib/actions/events";
import { listEventVisitors } from "@/lib/data/claims";
import { listVenues } from "@/lib/data/events";
import { coverUrl, getPrimaryHostname } from "@/lib/data/organizations";
import { listEventSpots, listSpots } from "@/lib/data/spots";
import { createClient } from "@/lib/supabase/server";
import { CoverForm } from "./CoverForm";
import { EventTabs } from "./EventTabs";
import { load } from "./load";
import { EVENT_TABS } from "./query";
import {
  AddScheduleForm,
  EditScheduleForm,
  EventDataForm,
  PublishButton,
  VenueForm,
} from "./ScheduleForms";
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
 * One event, in tabs (?tab=): General (data, venue, banner, schedules and
 * publishing), Spots and Visitantes. The print sheet and the raffle keep their
 * own pages: one goes to paper, the other on stage.
 */
export default async function EventoPage({
  params,
  searchParams,
}: PageProps<"/panel/[org]/eventos/[evento]">) {
  const { org: slug, evento } = await params;
  const query = await searchParams;
  const tab = EVENT_TABS.find((t) => t === query.tab) ?? "general";
  const { org, support, event } = await load(slug, evento);
  const phase = eventPhase(event.status, event.schedules);
  const draft = event.status === "draft";
  const editable = !support;
  const supabase = await createClient();
  // Spots and visitors feed the tab counts and the figures in General; the
  // catalog only the Spots tab, the venues only the Editar sheet.
  const [inEvent, visitors, catalog, venues, hostname] = await Promise.all([
    listEventSpots(supabase, event.id),
    listEventVisitors(supabase, event.id),
    editable && tab === "spots" ? listSpots(supabase, org.id) : [],
    editable ? listVenues(supabase, org.id) : [],
    getPrimaryHostname(supabase, org.id),
  ]);
  const cover = coverUrl(event.cover_path);

  return (
    <>
      <TopBar
        title={event.title}
        crumbs={[{ label: "Eventos", href: `/panel/${org.slug}` }]}
        actions={
          <>
            {editable && (
              <EditSheet
                label="Editar"
                ariaLabel={`Editar ${event.title}`}
                title={`Editar ${event.title}`}
                description="Datos, sede y banner del evento. Las jornadas se editan desde la pestaña General."
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
                        className="underline decoration-2 underline-offset-4"
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
                <section aria-labelledby="banner-editar" className="grid gap-4">
                  <h3 id="banner-editar" className="text-px-2">
                    Banner
                  </h3>
                  {cover && <EventCover src={cover} alt="Banner actual" />}
                  <CoverForm
                    ids={{
                      org: org.slug,
                      organizationId: org.id,
                      eventId: event.id,
                    }}
                    hasCover={cover !== undefined}
                  />
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
              publicUrl={
                event.status === "published" && hostname
                  ? `${publicOrigin(hostname)}/eventos/${event.slug}`
                  : null
              }
              support={support}
            />
          </>
        }
      />
      <PageBody>
        <header className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-px-3 sm:text-px-4">{event.title}</h1>
            <PhaseBadge phase={phase} />
          </div>
          {event.summary && <p className="max-w-prose">{event.summary}</p>}
        </header>

        <dl className="grid border-2 border-lcd-3 sm:grid-cols-3">
          {(
            [
              [
                "Fechas",
                formatEventDates(event.schedules, event.timezone) ??
                  "Sin fecha",
              ],
              ["Sede", event.venue?.name ?? "Sin sede"],
              ["Edición", event.edition_label ?? "—"],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 px-4 py-3 not-last:border-b-2 not-last:border-lcd-3 sm:not-last:border-r-2 sm:not-last:border-b-0"
            >
              <dt className="font-display text-px-1 text-muted-foreground">
                {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <EventTabs
          value={tab}
          counts={{ spots: inEvent.length, visitantes: visitors.length }}
        >
          {tab === "spots" ? (
            <SpotsTab
              org={org.slug}
              eventId={event.id}
              support={support}
              inEvent={inEvent}
              catalog={catalog}
              params={query}
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
            <General
              org={org}
              event={event}
              cover={cover}
              editable={editable}
              draft={draft}
              stats={{
                visitors: visitors.length,
                medals: visitors.reduce((n, v) => n + v.medals, 0),
                activeSpots: inEvent.filter((s) => s.is_active).length,
              }}
            />
          )}
        </EventTabs>
      </PageBody>
    </>
  );
}

type Loaded = Awaited<ReturnType<typeof load>>;

/**
 * The event's own data, to read: figures, publishing, banner and schedules.
 * Changes go through the Editar sheet (data, venue, banner) and the
 * schedules' own sheet.
 */
function General({
  org,
  event,
  cover,
  editable,
  draft,
  stats,
}: {
  org: Loaded["org"];
  event: Loaded["event"];
  cover: string | undefined;
  editable: boolean;
  draft: boolean;
  stats: { visitors: number; medals: number; activeSpots: number };
}) {
  const label = (s: { label: string | null }, i: number) =>
    s.label ?? `Jornada ${i + 1}`;
  const when = (s: (typeof event.schedules)[number]) =>
    `${formatEventDates([s], event.timezone)} · ${formatScheduleTimes(s, event.timezone)}`;

  const schedulesSheet = editable && (
    <EditSheet
      label={
        event.schedules.length === 0 ? "Agregar jornadas" : "Editar jornadas"
      }
      title="Jornadas"
      description={`Cada jornada es un día del evento, con su horario, en ${event.timezone.replaceAll("_", " ")}.`}
      variant={event.schedules.length === 0 ? "primary" : "secondary"}
    >
      {event.schedules.length > 0 && (
        <ol className="grid gap-2">
          {event.schedules.map((s, i) => (
            <li key={s.id} className="border-2 border-lcd-3">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-lcd-1 [&::-webkit-details-marker]:hidden">
                  <span className="grid gap-1">
                    <span className="font-display text-px-2">
                      {label(s, i)}
                    </span>
                    <span className="text-sm">{when(s)}</span>
                  </span>
                  <span className="shrink-0 font-display text-px-1 group-open:hidden">
                    Editar
                  </span>
                </summary>
                <div className="grid gap-6 border-t-2 border-lcd-3 px-4 py-5">
                  <EditScheduleForm
                    org={org.slug}
                    eventId={event.id}
                    timezone={event.timezone}
                    schedule={s}
                  />
                  <ActionButton
                    action={deleteScheduleAction}
                    fields={{ org: org.slug, id: s.id }}
                    label="Quitar jornada"
                    pendingLabel="Quitando…"
                    ariaLabel={`Quitar ${label(s, i)}`}
                  />
                </div>
              </details>
            </li>
          ))}
        </ol>
      )}
      <section aria-labelledby="nueva-jornada" className="panel grid gap-6 p-6">
        <h3 id="nueva-jornada" className="text-px-2">
          Nueva jornada
        </h3>
        <AddScheduleForm
          org={org.slug}
          eventId={event.id}
          timezone={event.timezone}
        />
      </section>
    </EditSheet>
  );

  return (
    <>
      {draft && editable && (
        <section aria-labelledby="publicar" className="grid gap-3">
          <h2 id="publicar" className="text-px-2">
            Publicación
          </h2>
          <p className="max-w-prose">
            Es un borrador: solo lo ve tu equipo. Al publicarlo aparece en el
            dominio de la organización.
          </p>
          <PublishButton
            org={org.slug}
            eventId={event.id}
            ready={event.schedules.length > 0}
          />
        </section>
      )}

      {!draft && (
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          <StatTile
            label="Visitantes"
            value={stats.visitors}
            caption="registrados"
          />
          <StatTile
            label="Medallas"
            value={stats.medals}
            caption="entregadas"
          />
          <StatTile
            label="Spots activos"
            value={stats.activeSpots}
            caption="entregan medalla"
          />
        </div>
      )}

      <section aria-labelledby="jornadas" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="jornadas" className="text-px-2">
            Jornadas
          </h2>
          {schedulesSheet}
        </div>
        {event.schedules.length === 0 ? (
          <div className="grid gap-2 border-2 border-dashed border-lcd-2 px-6 py-8 *:max-w-prose">
            <p className="font-display text-px-2">Todavía no hay jornadas</p>
            <p>
              Cada jornada es un día del evento, con su horario. De ellas sale
              si el evento es próximo, está en curso o terminó.
            </p>
          </div>
        ) : (
          <ol className="grid gap-2">
            {event.schedules.map((s, i) => (
              <li
                key={s.id}
                className="grid gap-1 border-2 border-lcd-3 px-4 py-3"
              >
                <p className="font-display text-px-2">{label(s, i)}</p>
                <p className="text-sm">{when(s)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="banner" className="grid max-w-3xl gap-4">
        <h2 id="banner" className="text-px-2">
          Banner
        </h2>
        {cover ? (
          <EventCover src={cover} alt="Banner actual" />
        ) : (
          <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
            Todavía no hay banner.
            {editable &&
              " Lo subís desde Editar; se ve arriba de todo en la portada del evento."}
          </p>
        )}
      </section>
    </>
  );
}

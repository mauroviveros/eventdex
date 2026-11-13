import type { Metadata } from "next";
import Link from "next/link";
import { ActiveEvent } from "@/components/panel/ActiveEvent";
import { DraftChecklist } from "@/components/panel/DraftChecklist";
import {
  EventFilters,
  type PhaseFilter,
} from "@/components/panel/EventFilters";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { buttonClass } from "@/components/ui/Button";
import {
  activeEvent,
  eventPhase,
  formatEventDates,
  sortForPanel,
} from "@/domain/events";
import { publicOrigin } from "@/domain/spots";
import { listEvents } from "@/lib/data/events";
import { getPrimaryHostname } from "@/lib/data/organizations";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { type EventRow, EventsTable } from "./EventsTable";

const FILTERS: PhaseFilter[] = [
  "todos",
  "en-curso",
  "proximo",
  "finalizado",
  "borrador",
];

// Search ignores case and accents: "expo" finds "Exposición".
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export async function generateMetadata({
  params,
}: PageProps<"/panel/[org]">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Eventos · ${org.name}` };
}

/**
 * The organization's dashboard: the event that matters today, the drafts with
 * what they lack, and every event in a table, filterable by phase and search.
 */
export default async function OrgEventsPage({
  params,
  searchParams,
}: PageProps<"/panel/[org]">) {
  const { org, support } = await requireOrg((await params).org);
  const { fase, q } = await searchParams;
  const current = FILTERS.find((f) => f === fase) ?? "todos";
  const query = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  const [events, hostname] = await Promise.all([
    listEvents(supabase, org.id),
    getPrimaryHostname(supabase, org.id),
  ]);

  const now = new Date();
  const rows = sortForPanel(
    events.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      edition: e.edition_label,
      phase: eventPhase(e.status, e.schedules, now),
      schedules: e.schedules,
      dates: formatEventDates(e.schedules, e.timezone, now),
      venue: e.venue?.name ?? null,
      stats: e.stats,
      draft: e.status === "draft",
      ready: e.schedules.length > 0,
      publicUrl:
        e.status === "published" && hostname
          ? `${publicOrigin(hostname)}/eventos/${e.slug}`
          : null,
    })) satisfies (EventRow & { schedules: unknown })[],
  );
  const active = activeEvent(rows);
  const drafts = rows.filter((r) => r.draft);

  // Counts follow the search, so each filter says how many rows it shows.
  const needle = fold(query);
  const matching = rows.filter(
    (r) =>
      !needle ||
      fold(`${r.title} ${r.edition ?? ""} ${r.venue ?? ""}`).includes(needle),
  );
  const counts = Object.fromEntries(
    FILTERS.map((f) => [
      f,
      f === "todos"
        ? matching.length
        : matching.filter((r) => r.phase === f).length,
    ]),
  ) as Record<PhaseFilter, number>;
  const shown = matching.filter(
    (r) => current === "todos" || r.phase === current,
  );

  const newEvent = !support && (
    <Link
      href={`/panel/${org.slug}/eventos/nuevo`}
      className={buttonClass("primary", "no-underline")}
    >
      Nuevo evento
    </Link>
  );

  return (
    <>
      <TopBar title="Eventos" actions={newEvent} />
      <PageBody>
        {/* The org's name is in the sidebar; the bar says the section. */}
        <h1 className="sr-only">Eventos de {org.name}</h1>

        {rows.length === 0 ? (
          <section className="grid max-w-prose gap-3 border-2 border-dashed border-lcd-2 px-6 py-8">
            <h2 className="text-px-2">Todavía no hay eventos</h2>
            <p>
              Creá el primero: le cargás las jornadas y la sede, y lo publicás
              cuando esté listo.
            </p>
            {newEvent && <div>{newEvent}</div>}
          </section>
        ) : (
          <>
            {active && (
              <ActiveEvent
                org={org.slug}
                event={active}
                publicUrl={active.publicUrl}
              />
            )}

            {drafts.length > 0 && (
              <DraftChecklist
                org={org.slug}
                drafts={drafts.map((d) => ({
                  slug: d.slug,
                  title: d.title,
                  edition: d.edition,
                  hasSchedules: d.ready,
                  hasSpots: d.stats.stands > 0,
                  hasVenue: d.venue !== null,
                }))}
              />
            )}

            <section aria-labelledby="todos-los-eventos" className="grid gap-4">
              <h2 id="todos-los-eventos" className="text-px-2">
                Todos los eventos
              </h2>
              <EventFilters
                basePath={`/panel/${org.slug}`}
                current={current}
                counts={counts}
                query={query}
              />
              {shown.length === 0 ? (
                <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
                  <p className="font-display text-px-2">
                    Ningún evento coincide
                  </p>
                  <p>
                    Probá con otra búsqueda o{" "}
                    <Link href={`/panel/${org.slug}`}>
                      mirá todos los eventos
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <EventsTable org={org.slug} rows={shown} support={support} />
              )}
            </section>
          </>
        )}
      </PageBody>
    </>
  );
}

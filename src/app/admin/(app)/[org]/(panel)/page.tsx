import type { Metadata } from "next";
import Link from "next/link";
import { EventActions } from "@/components/admin/EventActions";
import { EventCard } from "@/components/admin/EventCard";
import {
  EventFilters,
  type PhaseFilter,
} from "@/components/admin/EventFilters";
import { StatTile } from "@/components/admin/StatTile";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { buttonClass } from "@/components/ui/Button";
import { eventPhase, formatEventDates } from "@/domain/events";
import { publicOrigin } from "@/domain/spots";
import { listEvents } from "@/lib/data/events";
import { getPrimaryHostname } from "@/lib/data/organizations";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

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
}: PageProps<"/admin/[org]">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Eventos · ${org.name}` };
}

/** The organization's dashboard: headline figures and its events, filterable by phase. */
export default async function OrgEventsPage({
  params,
  searchParams,
}: PageProps<"/admin/[org]">) {
  const { org, support } = await requireOrg((await params).org);
  const { fase, q } = await searchParams;
  const current = FILTERS.find((f) => f === fase) ?? "todos";
  const query = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  const [events, hostname] = await Promise.all([
    listEvents(supabase, org.id),
    getPrimaryHostname(supabase, org.id),
  ]);
  const total = (key: "visitors" | "medals") =>
    events.reduce((n, e) => n + e.stats[key], 0);

  const now = new Date();
  const cards = events.map((e) => ({
    ...e,
    phase: eventPhase(e.status, e.schedules, now),
  }));
  // Counts follow the search, so each filter says how many cards it shows.
  const needle = fold(query);
  const matching = cards.filter(
    (c) =>
      !needle || fold(`${c.title} ${c.venue?.name ?? ""}`).includes(needle),
  );
  const counts = Object.fromEntries(
    FILTERS.map((f) => [
      f,
      f === "todos"
        ? matching.length
        : matching.filter((c) => c.phase === f).length,
    ]),
  ) as Record<PhaseFilter, number>;
  const shown = matching.filter(
    (c) => current === "todos" || c.phase === current,
  );

  const newEvent = !support && (
    <Link
      href={`/${org.slug}/eventos/nuevo`}
      className={buttonClass("primary", "no-underline")}
    >
      Nuevo evento
    </Link>
  );

  return (
    <>
      <TopBar title="Eventos" actions={newEvent} />
      <PageBody>
        <h1 className="text-px-3 sm:text-px-4">{org.name}</h1>

        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          <StatTile
            label="Eventos"
            value={events.length}
            caption="en la organización"
          />
          <StatTile
            label="Visitantes"
            value={total("visitors")}
            // Registrations add up per event: someone at two events counts twice.
            caption="sumando cada evento"
          />
          <StatTile
            label="Medallas"
            value={total("medals")}
            caption="sumando cada evento"
          />
        </div>

        {events.length === 0 ? (
          <section className="grid max-w-prose gap-3 border-2 border-dashed border-lcd-2 px-6 py-8">
            <h2 className="text-px-2">Todavía no hay eventos</h2>
            <p>
              Creá el primero: le cargás las jornadas y la sede, y lo publicás
              cuando esté listo.
            </p>
            {newEvent && <div>{newEvent}</div>}
          </section>
        ) : (
          <section
            aria-labelledby="lista-eventos"
            className="grid grid-cols-1 gap-6"
          >
            <h2 id="lista-eventos" className="sr-only">
              Eventos de la organización
            </h2>
            <EventFilters
              basePath={`/${org.slug}`}
              current={current}
              counts={counts}
              query={query}
            />
            {shown.length === 0 ? (
              <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
                <p className="font-display text-px-2">Ningún evento coincide</p>
                <p>
                  Probá con otra búsqueda o{" "}
                  <Link href={`/${org.slug}`}>mirá todos los eventos</Link>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {shown.map((e) => (
                  <EventCard
                    key={e.id}
                    title={e.title}
                    phase={e.phase}
                    dateLabel={formatEventDates(e.schedules, e.timezone, now)}
                    venue={e.venue?.name ?? null}
                    href={`/${org.slug}/eventos/${e.slug}`}
                    stats={e.stats}
                    actions={
                      <EventActions
                        org={org.slug}
                        event={{
                          id: e.id,
                          slug: e.slug,
                          title: e.title,
                          draft: e.status === "draft",
                        }}
                        hasSpots={e.stats.stands > 0}
                        ready={e.schedules.length > 0}
                        publicUrl={
                          e.status === "published" && hostname
                            ? `${publicOrigin(hostname)}/eventos/${e.slug}`
                            : null
                        }
                        support={support}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </PageBody>
    </>
  );
}

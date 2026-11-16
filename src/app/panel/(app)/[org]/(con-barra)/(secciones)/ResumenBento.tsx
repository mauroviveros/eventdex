import Link from "next/link";
import { HourlyChart } from "@/components/panel/HourlyChart";
import {
  ActivityFeed,
  HoursLegend,
  overviewCells,
  SpotRanking,
  Tile,
  TileEmpty,
} from "@/components/panel/Overview";
import { StatStrip } from "@/components/panel/StatStrip";
import { buttonClass } from "@/components/ui/Button";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import type { Phase } from "@/domain/events";
import type { HourCount } from "@/domain/overview";
import type { Activity, EventOverview, RankedSpot } from "@/lib/data/overview";

type Featured = {
  slug: string;
  title: string;
  edition: string | null;
  phase: Phase;
  dates: string | null;
  timeZone: string;
  overview: EventOverview;
  day: { startsAt: string; hours: HourCount[] } | null;
  /** The charted day is the one running now (else the last with medals). */
  today: boolean;
  ranking: RankedSpot[];
};

type Props = {
  org: string;
  /** Read-only support visit: no "Nuevo evento". */
  support: boolean;
  audience: { visitors: number; returned: number };
  featured: Featured | null;
  activity: Activity[];
  titles: ReadonlyMap<string, string>;
  timeZone: string;
  next: { slug: string; title: string; phase: Phase; dates: string | null }[];
  /** The current hour (ISO), while the featured event runs. */
  now?: string;
};

const n = (v: number) => v.toLocaleString("es-AR");
const TOP_STANDS = 5;

/**
 * The organization's Resumen, event first: the event of the moment in the
 * double-ruled panel with its figures, its hours and stands side by side, then
 * the latest activity, the audience and what comes next.
 */
export function ResumenBento({
  org,
  support,
  audience,
  featured,
  activity,
  titles,
  timeZone,
  next,
  now,
}: Props) {
  const eventHref = (slug: string) => `/panel/${org}/eventos/${slug}`;
  return (
    <div className="grid gap-4">
      {featured ? (
        <>
          <section
            aria-labelledby="del-momento"
            className="panel grid gap-5 p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="grid justify-items-start gap-2">
                <PhaseBadge phase={featured.phase} />
                <h2 id="del-momento" className="text-px-3 text-balance">
                  {featured.title}
                  {featured.edition && (
                    <span className="text-muted-foreground">
                      {" "}
                      {featured.edition}
                    </span>
                  )}
                </h2>
                <p className="text-muted-foreground">
                  {featured.dates ?? "Sin fecha"}
                </p>
              </div>
              <Link
                href={eventHref(featured.slug)}
                className={buttonClass("primary", "no-underline")}
              >
                Ver el evento
              </Link>
            </div>
            <StatStrip cells={overviewCells(featured.overview)} />
          </section>
          <div className="grid gap-4 lg:grid-cols-3">
            <Tile
              id="afluencia"
              title="Afluencia"
              aside={<HoursLegend />}
              className="lg:col-span-2"
            >
              <p className="-mt-2 text-sm text-muted-foreground">
                {featured.today ? "Hoy" : "Última jornada"}
              </p>
              {featured.day && featured.overview.medals > 0 ? (
                <HourlyChart
                  hours={featured.day.hours}
                  timeZone={featured.timeZone}
                  now={now}
                  label={`Medallas por hora · ${featured.title}`}
                />
              ) : (
                <TileEmpty>Todavía no hay medallas en este evento.</TileEmpty>
              )}
            </Tile>
            <Tile
              id="stands"
              title="Stands"
              aside={
                <Link
                  href={eventHref(featured.slug)}
                  className="font-display text-px-1"
                >
                  Ver todos
                </Link>
              }
            >
              <SpotRanking spots={featured.ranking} top={TOP_STANDS} />
            </Tile>
          </div>
        </>
      ) : (
        <section className="grid gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
          <h2 className="text-px-2">Todavía no hubo un evento</h2>
          <p className="max-w-prose">
            La afluencia y los stands aparecen cuando un evento empieza.
          </p>
        </section>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <Tile
          id="actividad"
          title="Actividad"
          aside={
            <Link
              href={`/panel/${org}/actividad`}
              className="font-display text-px-1"
            >
              Ver toda la actividad
            </Link>
          }
        >
          <ActivityFeed items={activity} timeZone={timeZone} events={titles} />
        </Tile>
        <Tile id="publico" title="Público">
          <dl className="grid gap-4">
            <div className="grid gap-1">
              <dt className="font-display text-px-1 text-muted-foreground">
                Visitantes únicos
              </dt>
              <dd className="font-display text-px-3 tabular-nums">
                {n(audience.visitors)}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-display text-px-1 text-muted-foreground">
                Volvieron
              </dt>
              <dd className="font-display text-px-3 tabular-nums">
                {n(audience.returned)}
              </dd>
              <dd className="text-sm text-muted-foreground">
                Fueron a 2 o más eventos
              </dd>
            </div>
          </dl>
        </Tile>
        <Tile
          id="proximos"
          title="Lo que viene"
          aside={
            <Link
              href={`/panel/${org}/eventos`}
              className="font-display text-px-1"
            >
              Ver eventos
            </Link>
          }
        >
          {next.length === 0 ? (
            <TileEmpty>No hay eventos próximos ni borradores.</TileEmpty>
          ) : (
            <ul className="grid gap-2">
              {next.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={eventHref(e.slug)}
                    className="flex items-center justify-between gap-3 border-2 border-lcd-3 px-4 py-3 no-underline hover:bg-lcd-1"
                  >
                    <span className="grid min-w-0 gap-0.5">
                      <span className="truncate font-display text-px-1">
                        {e.title}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {e.dates ?? "Sin fecha"}
                      </span>
                    </span>
                    <PhaseBadge phase={e.phase} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!support && (
            <Link
              href={`/panel/${org}/eventos/nuevo`}
              className={buttonClass("secondary", "w-full no-underline")}
            >
              Nuevo evento
            </Link>
          )}
        </Tile>
      </div>
    </div>
  );
}

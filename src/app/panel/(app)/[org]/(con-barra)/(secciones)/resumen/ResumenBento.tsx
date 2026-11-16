import Link from "next/link";
import type { ReactNode } from "react";
import { HourlyChart } from "@/components/panel/HourlyChart";
import { ActivityFeed, overviewCells } from "@/components/panel/Overview";
import { StatStrip } from "@/components/panel/StatStrip";
import { type IconName, PixelIcon } from "@/components/pixel/icons";
import { buttonClass } from "@/components/ui/Button";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import type { Phase } from "@/domain/events";
import type { HourCount } from "@/domain/overview";
import type { Activity, EventOverview, RankedSpot } from "@/lib/data/overview";

// shortcut: three design alternatives behind ?alt= for Mauro to choose; keep one and delete the rest in the Vista

export const ALTS = ["a", "b", "c"] as const;
type Alt = (typeof ALTS)[number];

type Featured = {
  slug: string;
  title: string;
  edition: string | null;
  phase: Phase;
  dates: string | null;
  timeZone: string;
  overview: EventOverview;
  day: { startsAt: string; hours: HourCount[] } | null;
  ranking: RankedSpot[];
};

type Props = {
  org: string;
  alt: Alt;
  audience: { visitors: number; returned: number };
  live: number;
  featured: Featured | null;
  activity: Activity[];
  titles: ReadonlyMap<string, string>;
  timeZone: string;
  next: { slug: string; title: string; phase: Phase; dates: string | null }[];
  now?: string;
};

const n = (v: number) => v.toLocaleString("es-AR");

export function ResumenBento(props: Props) {
  return (
    <div className="grid gap-6">
      <AltSwitcher org={props.org} alt={props.alt} />
      {props.alt === "b" ? (
        <EventoAlFrente {...props} />
      ) : (
        <Referencia {...props} steps={props.alt === "c"} />
      )}
    </div>
  );
}

function AltSwitcher({ org, alt }: { org: string; alt: Alt }) {
  const names: Record<Alt, string> = {
    a: "A · Referencia",
    b: "B · Evento al frente",
    c: "C · Escalones",
  };
  return (
    <nav
      aria-label="Alternativas de diseño (temporal)"
      className="flex flex-wrap gap-2"
    >
      {ALTS.map((a) => (
        <Link
          key={a}
          href={`/panel/${org}/resumen?alt=${a}`}
          aria-current={a === alt ? "page" : undefined}
          className="border-2 border-lcd-3 px-3 py-2 font-display text-px-1 no-underline aria-[current=page]:bg-lcd-3 aria-[current=page]:text-lcd-0"
        >
          {names[a]}
        </Link>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Tiles
// ---------------------------------------------------------------------------

function Tile({
  id,
  title,
  aside,
  children,
  className = "",
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`grid min-w-0 content-start gap-4 border-2 border-lcd-3 p-4 sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id={id} className="text-px-2">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Figure({
  icon,
  label,
  value,
  caption,
  badge,
}: {
  icon: IconName;
  label: string;
  value: string;
  caption?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="grid content-start gap-3 border-2 border-lcd-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-10 place-items-center bg-lcd-1">
          <PixelIcon name={icon} size={24} />
        </span>
        {badge}
      </div>
      <p className="grid gap-1">
        <span className="font-display text-px-3 leading-none tabular-nums">
          {value}
        </span>
        <span className="font-display text-px-1 text-muted-foreground">
          {label}
        </span>
      </p>
      {caption && <p className="text-sm text-muted-foreground">{caption}</p>}
    </div>
  );
}

function Legend({ steps }: { steps: boolean }) {
  const items: [string, string][] = steps
    ? [
        ["bg-lcd-3", "Medallas"],
        ["bg-lcd-2", "Primeras medallas"],
      ]
    : [
        ["bg-lcd-2", "Primeras medallas"],
        ["bg-lcd-3", "De quienes ya tenían"],
      ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {items.map(([tone, label]) => (
        <li key={label} className="flex items-center gap-2">
          <span aria-hidden className={`size-3 ${tone}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function Afluencia({
  featured,
  steps,
  now,
}: {
  featured: Featured;
  steps: boolean;
  now?: string;
}) {
  const label = `Medallas por hora · ${featured.title}`;
  return (
    <Tile
      id="afluencia"
      title="Afluencia"
      aside={<Legend steps={steps} />}
      className="lg:col-span-2"
    >
      <p className="-mt-2 text-sm text-muted-foreground">
        {featured.title}
        {featured.phase === "en-curso" ? " · hoy" : " · última jornada"}
      </p>
      {featured.day && featured.overview.medals > 0 ? (
        <HourlyChart
          hours={featured.day.hours}
          timeZone={featured.timeZone}
          now={now}
          look={steps ? "escalones" : "barras"}
          label={label}
        />
      ) : (
        <Empty>Todavía no hay medallas en este evento.</Empty>
      )}
    </Tile>
  );
}

const TOP = 5;

function Stands({
  org,
  featured,
  cells,
}: {
  org: string;
  featured: Featured;
  cells: boolean;
}) {
  const top = featured.ranking.slice(0, TOP);
  const max = Math.max(1, ...top.map((s) => s.medals));
  return (
    <Tile
      id="stands"
      title="Stands"
      aside={
        <Link
          href={`/panel/${org}/eventos/${featured.slug}`}
          className="font-display text-px-1"
        >
          Ver todos
        </Link>
      }
    >
      {top.length === 0 ? (
        <Empty>El evento no tiene stands.</Empty>
      ) : (
        <ol className="grid gap-4">
          {top.map((s) => (
            <li key={s.id} className="grid gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="font-display text-px-1">{s.code}</span>
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="shrink-0 font-display text-px-1 tabular-nums">
                  {n(s.medals)}
                  <span className="sr-only"> medallas</span>
                </span>
              </div>
              {cells ? (
                <div
                  aria-hidden
                  className="grid grid-cols-12 gap-0.5 border-2 border-lcd-3 p-0.5"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed cells, never reordered.
                      key={i}
                      className={`h-3 ${i < Math.round((s.medals / max) * 12) ? "bg-lcd-3" : "bg-lcd-1"}`}
                    />
                  ))}
                </div>
              ) : s.medals === 0 ? (
                <div className="h-3 border-2 border-dashed border-lcd-2" />
              ) : (
                <div className="h-3 bg-lcd-1">
                  <div
                    className="h-full bg-lcd-3"
                    style={{ width: `${(s.medals / max) * 100}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </Tile>
  );
}

function Actividad({
  org,
  activity,
  titles,
  timeZone,
}: Pick<Props, "org" | "activity" | "titles" | "timeZone">) {
  return (
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
  );
}

function Proximos({ org, next }: Pick<Props, "org" | "next">) {
  return (
    <Tile
      id="proximos"
      title="Lo que viene"
      aside={
        <Link href={`/panel/${org}`} className="font-display text-px-1">
          Ver eventos
        </Link>
      }
    >
      {next.length === 0 ? (
        <Empty>No hay eventos próximos ni borradores.</Empty>
      ) : (
        <ul className="grid gap-2">
          {next.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/panel/${org}/eventos/${e.slug}`}
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
      <Link
        href={`/panel/${org}/eventos/nuevo`}
        className={buttonClass("secondary", "w-full no-underline")}
      >
        Nuevo evento
      </Link>
    </Tile>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="border-2 border-dashed border-lcd-2 px-4 py-6 text-muted-foreground">
      {children}
    </p>
  );
}

function NoFeatured() {
  return (
    <section className="grid gap-2 border-2 border-dashed border-lcd-2 px-6 py-8 lg:col-span-3">
      <p className="font-display text-px-2">Todavía no hubo un evento</p>
      <p className="max-w-prose">
        La afluencia y los stands aparecen con el primer evento en curso.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// A · Referencia (and C · Escalones): figures in four tiles, the two charts
// side by side, then the latest activity and what comes next.
// ---------------------------------------------------------------------------

function Referencia({
  org,
  audience,
  live,
  featured,
  activity,
  titles,
  timeZone,
  next,
  now,
  steps,
}: Props & { steps: boolean }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Figure
          icon="equipo"
          label="Visitantes únicos"
          value={n(audience.visitors)}
          caption="En todos los eventos"
        />
        <Figure
          icon="resumen"
          label="Volvieron"
          value={n(audience.returned)}
          caption="Fueron a 2 o más eventos"
        />
        <Figure
          icon="trofeo"
          label="Medallas"
          value={n(featured?.overview.medals ?? 0)}
          caption={featured ? `En ${featured.title}` : "Sin eventos todavía"}
        />
        <Figure
          icon="calendario"
          label={live === 1 ? "Evento en curso" : "Eventos en curso"}
          value={n(live)}
          badge={live > 0 ? <PhaseBadge phase="en-curso" /> : undefined}
          caption={live > 0 ? undefined : "Ninguno ahora"}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {featured ? (
          <>
            <Afluencia featured={featured} steps={steps} now={now} />
            <Stands org={org} featured={featured} cells={steps} />
          </>
        ) : (
          <NoFeatured />
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Actividad
          org={org}
          activity={activity}
          titles={titles}
          timeZone={timeZone}
        />
        <Proximos org={org} next={next} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// B · Evento al frente: the event of the moment leads, in the double-ruled
// panel; the org's audience moves down beside the activity.
// ---------------------------------------------------------------------------

function EventoAlFrente({
  org,
  audience,
  featured,
  activity,
  titles,
  timeZone,
  next,
  now,
}: Props) {
  return (
    <>
      {featured ? (
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
              href={`/panel/${org}/eventos/${featured.slug}`}
              className={buttonClass("primary", "no-underline")}
            >
              Ver el evento
            </Link>
          </div>
          <StatStrip cells={overviewCells(featured.overview)} />
        </section>
      ) : (
        <NoFeatured />
      )}
      {featured && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Afluencia featured={featured} steps={false} now={now} />
          <Stands org={org} featured={featured} cells={false} />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <Actividad
          org={org}
          activity={activity}
          titles={titles}
          timeZone={timeZone}
        />
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
        <Proximos org={org} next={next} />
      </div>
    </>
  );
}

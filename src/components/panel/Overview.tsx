import Link from "next/link";
import type { ReactNode } from "react";
import { HourlyChart, type SeriesLabels } from "@/components/panel/HourlyChart";
import {
  FEW_VISITORS,
  funnel,
  type HourCount,
  medalsPerVisitor,
} from "@/domain/overview";
import { leftOut, unusedSlots } from "@/domain/reports";
import type { Activity, EventOverview, RankedSpot } from "@/lib/data/overview";
import type { PrizeOutcome } from "@/lib/data/reports";

/**
 * The pieces of the overview, shared by the organization's Resumen and the
 * event's Resumen tab: tiles, figures, hours, funnel, stands and activity.
 */

const n = (v: number) => v.toLocaleString("es-AR");
const pct = new Intl.NumberFormat("es-AR", {
  style: "percent",
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

/** The event's four figures, as StatStrip cells. */
export function overviewCells(o: EventOverview): [string, string, string?][] {
  const per = medalsPerVisitor(o);
  return [
    ["Visitantes", n(o.visitors)],
    ["Medallas", n(o.medals)],
    ["Por visitante", per === null ? "–" : decimal.format(per)],
    [
      "Stands sin medallas",
      n(o.idleStands),
      `de ${n(o.stands)} ${o.stands === 1 ? "activo" : "activos"}`,
    ],
  ];
}

/** A square of the bento: a framed, titled section with an optional link or legend beside the title. */
export function Tile({
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

/** What a tile says while it has nothing to show. */
export function TileEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="border-2 border-dashed border-lcd-2 px-4 py-6 text-muted-foreground">
      {children}
    </p>
  );
}

/** The two tones of the hourly bars. */
export function HoursLegend({ labels }: { labels?: SeriesLabels }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <li className="flex items-center gap-2">
        <span aria-hidden className="size-3 bg-lcd-2" />
        {labels?.newcomers ?? "Primeras medallas"}
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden className="size-3 bg-lcd-3" />
        {labels?.returning ?? "De quienes ya tenían"}
      </li>
    </ul>
  );
}

export function EmptyOverview() {
  return (
    <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
      <p className="font-display text-px-2">Todavía no hay medallas</p>
      <p>
        Las cifras, la afluencia y la actividad aparecen con la primera medalla
        del evento.
      </p>
    </div>
  );
}

export function FewDataNote() {
  return (
    <p className="max-w-prose border-2 border-dashed border-lcd-2 px-4 py-3 text-sm">
      Pocos datos todavía: con menos de {FEW_VISITORS} visitantes, los gráficos
      muestran lo que pasó pero no una tendencia.
    </p>
  );
}

type Day = { startsAt: string; hours: HourCount[] };

function dayLabel(day: Day, i: number, total: number, timeZone: string) {
  if (total === 1) return "Medallas por hora";
  const date = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    timeZone,
  }).format(new Date(day.startsAt));
  return `Jornada ${i + 1} · ${date}`;
}

/** One chart per schedule (the legend goes in the tile's heading). */
export function HoursBySchedule({
  days,
  timeZone,
  now,
  labels,
  compact,
}: {
  days: Day[];
  timeZone: string;
  /** The current hour (ISO), marked while the event runs. */
  now?: string;
  labels?: SeriesLabels;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-6">
      {days.map((d, i) => (
        <div key={d.startsAt} className="grid gap-2">
          {days.length > 1 && (
            <h3 className="text-px-1">
              {dayLabel(d, i, days.length, timeZone)}
            </h3>
          )}
          <HourlyChart
            hours={d.hours}
            timeZone={timeZone}
            now={now}
            labels={labels}
            compact={compact}
            label={dayLabel(d, i, days.length, timeZone)}
          />
        </div>
      ))}
    </div>
  );
}

const STEP_LABEL = {
  registrados: "Registrados",
  mitad: "Llegaron a la mitad",
  todas: "Completaron",
} as const;

/** Registered → half → all, each with its count and share. */
export function FunnelBars({ overview }: { overview: EventOverview }) {
  return (
    <ol className="grid content-start gap-4">
      {funnel(overview).map((s) => (
        <li key={s.step} className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-px-1">{STEP_LABEL[s.step]}</span>
            <span className="tabular-nums">
              <span className="font-display text-px-2">{n(s.count)}</span>{" "}
              <span className="text-sm text-muted-foreground">
                {pct.format(s.share)}
              </span>
            </span>
          </div>
          <div className="h-6 border-2 border-lcd-3 p-0.5">
            <div
              className="h-full bg-lcd-3"
              style={{ width: `${s.share * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

const TOP = 8;

/**
 * The stands by medals: the first eight and the rest behind "Ver los otros",
 * or only the first `top` when the full list lives elsewhere.
 */
export function SpotRanking({
  spots,
  top,
  average = false,
  reportHref,
}: {
  spots: RankedSpot[];
  top?: number;
  /** Marks the average of the active stands on every bar, with its figure under the list. */
  average?: boolean;
  /** Where a stand's own report is: the row gets an «Informe» link. */
  reportHref?: (code: string) => string;
}) {
  if (spots.length === 0)
    return <TileEmpty>El evento no tiene stands.</TileEmpty>;
  const max = Math.max(1, ...spots.map((s) => s.medals));
  const active = spots.filter((s) => s.active);
  const mean =
    average && active.length > 0
      ? active.reduce((sum, s) => sum + s.medals, 0) / active.length
      : null;
  const row = (s: RankedSpot) => (
    <li key={s.id} className="grid gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="font-display text-px-1">{s.code}</span>
          <span className="truncate">{s.name}</span>
          {!s.active && (
            <span className="shrink-0 border-2 border-dashed border-lcd-2 px-1 text-sm">
              Apagado
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-baseline gap-3">
          {reportHref && s.medals > 0 && (
            <Link
              href={reportHref(s.code)}
              className="font-display text-px-1"
              aria-label={`Informe del stand ${s.code}`}
            >
              Informe
            </Link>
          )}
          <span className="font-display text-px-1 tabular-nums">
            {n(s.medals)}
            <span className="sr-only"> medallas</span>
          </span>
        </span>
      </div>
      {s.medals === 0 ? (
        <div className="h-3 border-2 border-dashed border-lcd-2" />
      ) : (
        <div className="relative h-3 bg-lcd-1">
          <div
            className="h-full bg-lcd-3"
            style={{ width: `${(s.medals / max) * 100}%` }}
          />
          {mean !== null && (
            <span
              aria-hidden
              className="absolute -inset-y-1 w-0.5 bg-accent-red"
              style={{ left: `${(mean / max) * 100}%` }}
            />
          )}
        </div>
      )}
    </li>
  );
  return (
    <div className="grid gap-3">
      <ol className="grid gap-3">{spots.slice(0, top ?? TOP).map(row)}</ol>
      {top === undefined && spots.length > TOP && (
        <details>
          <summary className="cursor-pointer font-display text-px-1">
            Ver los otros {spots.length - TOP}
          </summary>
          <ol className="mt-3 grid gap-3">{spots.slice(TOP).map(row)}</ol>
        </details>
      )}
      {mean !== null && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden className="h-3 w-0.5 bg-accent-red" />
          Promedio de los stands activos: {decimal.format(mean)} medallas
        </p>
      )}
    </div>
  );
}

/** What happened, in one sentence. */
export function activitySentence(a: Activity) {
  switch (a.kind) {
    case "medalla":
      return a.first
        ? `${a.visitor} llegó: primera medalla en ${a.detail}`
        : `${a.visitor} sumó ${a.detail}`;
    case "premio":
      return `${a.visitor} ganó «${a.detail}»`;
    case "sorteo":
      return `${a.visitor} salió en el sorteo «${a.detail}»`;
  }
}

/**
 * The latest, newest first: the time in the event's zone and a sentence.
 * With `events`, each line also says which event it was (the org's dashboard).
 */
export function ActivityFeed({
  items,
  timeZone,
  events,
}: {
  items: Activity[];
  timeZone: string;
  events?: ReadonlyMap<string, string>;
}) {
  if (items.length === 0) return <TileEmpty>Todavía no pasó nada.</TileEmpty>;
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  });
  return (
    <ol className="grid gap-3">
      {items.map((a) => (
        <li
          key={a.id}
          className="grid grid-cols-[auto_1fr] items-baseline gap-3"
        >
          <time
            dateTime={a.at}
            className="font-display text-px-1 text-muted-foreground tabular-nums"
          >
            {time.format(new Date(a.at))}
          </time>
          <span className="grid gap-0.5">
            <span className={a.kind === "medalla" ? "" : "font-bold"}>
              {activitySentence(a)}
            </span>
            {events?.has(a.eventId) && (
              <span className="text-sm text-muted-foreground">
                {events.get(a.eventId)}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

const KIND_LABEL = { premio: "Por mérito", sorteo: "Sorteo" } as const;

/**
 * How each prize and draw fared, to judge next time whether they were set right:
 * what it asked, who won (over its slots, if it has them), the slots nobody took
 * and who reached it without winning.
 */
export function PrizeOutcomes({ prizes }: { prizes: PrizeOutcome[] }) {
  if (prizes.length === 0)
    return <TileEmpty>El evento no tiene premios ni sorteos.</TileEmpty>;
  return (
    <ul className="grid gap-3">
      {prizes.map((p) => {
        const free = unusedSlots(p);
        const left = leftOut(p);
        return (
          <li
            key={`${p.kind}-${p.id}`}
            className="grid gap-1 border-2 border-lcd-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-x-6"
          >
            <span className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-px-2">{p.title}</span>
              <span className="border-2 border-lcd-2 px-1 text-sm">
                {KIND_LABEL[p.kind]}
              </span>
              <span className="text-sm text-muted-foreground">
                Pide {n(p.needed)} {p.needed === 1 ? "medalla" : "medallas"}
              </span>
            </span>
            <span className="font-display text-px-2 tabular-nums">
              {p.slots === null
                ? n(p.winners)
                : `${n(p.winners)} de ${n(p.slots)}`}
              <span className="font-sans text-sm text-muted-foreground">
                {" "}
                {p.winners === 1 ? "ganó" : "ganaron"}
              </span>
            </span>
            {p.kind === "sorteo" ? (
              <span className="text-sm sm:col-span-2">
                Participaban {n(p.reached)}.
              </span>
            ) : (free !== null && free > 0) || left > 0 ? (
              <span className="text-sm sm:col-span-2">
                {free !== null && free > 0 && (
                  <>
                    Sobraron {n(free)} {free === 1 ? "lugar" : "lugares"}.{" "}
                  </>
                )}
                {left > 0 && (
                  <>
                    Llegaron {n(p.reached)} y {n(left)} quedaron sin lugar.
                  </>
                )}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

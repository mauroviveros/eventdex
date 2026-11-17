import type { ReactNode } from "react";
import type { SeriesLabels } from "@/components/panel/HourlyChart";
import { HoursBySchedule, HoursLegend } from "@/components/panel/Overview";
import { StatStrip } from "@/components/panel/StatStrip";
import { Logo } from "@/components/pixel/Logo";
import { Monogram } from "@/components/ui/Monogram";
import type { HourCount } from "@/domain/overview";
import { medalsPerVisitor } from "@/domain/overview";
import { placeLabel, shareOfAudience, versusAverage } from "@/domain/reports";
import { logoUrl } from "@/lib/data/organizations";

/**
 * The printed reports, one A4 each: the event's, to sell it to a sponsor who
 * might come in, and a stand's, for the sponsor that was there. Both come out as
 * a «ficha»: the org's mark and the event on top, the figures in a strip, the
 * hours of each day, one line of context and the cut date.
 */

type Day = { startsAt: string; hours: HourCount[] };

type Head = {
  kind: string;
  orgName: string;
  logoPath: string | null;
  title: string;
  /** The event, when the title is a stand's. */
  subtitle?: string;
  dates: string | null;
  venue: string | null;
};

type Cut = { at: string; partial: boolean };

const int = new Intl.NumberFormat("es-AR");
const dec = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat("es-AR", {
  style: "percent",
  maximumFractionDigits: 0,
});

/**
 * One A4 of the report. `print-color-adjust: exact` keeps the bars and the
 * ground when printed: browsers drop backgrounds by default.
 */
function Sheet({
  head,
  cut,
  note,
  children,
}: {
  head: Head;
  cut: Cut;
  note: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto grid min-h-[277mm] w-full max-w-[190mm] grid-rows-[auto_1fr_auto] gap-[6mm] border-2 border-lcd-3 bg-lcd-0 p-[8mm] text-lcd-3 [-webkit-print-color-adjust:exact] [print-color-adjust:exact] print:border-0">
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-3 font-display text-px-2">
            {head.logoPath ? (
              <Logo
                src={logoUrl(head.logoPath)}
                mode="lleno"
                label=""
                className="size-10 shrink-0 object-contain"
              />
            ) : (
              <Monogram text={head.orgName} />
            )}
            <span className="truncate">{head.orgName}</span>
          </span>
          <span className="shrink-0 border-2 border-lcd-3 px-2 py-1 font-display text-px-1">
            {head.kind}
          </span>
        </div>
        <div className="panel grid gap-1 px-4 py-4">
          <h1 className="font-wide text-title text-balance">{head.title}</h1>
          {head.subtitle && <p className="text-lg">{head.subtitle}</p>}
          <p className="text-sm">
            {[head.dates, head.venue].filter(Boolean).join(" · ") ||
              "Sin fecha"}
          </p>
        </div>
      </header>
      <div className="grid content-start gap-[6mm]">{children}</div>
      <footer className="grid gap-1 border-t-2 border-lcd-3 pt-3 text-sm">
        <p>
          <span className="font-display text-px-1">
            {cut.partial ? "Parcial" : "Final"}
          </span>{" "}
          · Datos al {cut.at}
          {cut.partial &&
            ". El evento no terminó: las cifras siguen cambiando."}
        </p>
        <p className="text-muted-foreground">{note}</p>
      </footer>
    </article>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="border-b-2 border-lcd-3 pb-1 text-px-2">{children}</h2>;
}

/** The hours of each day, short so several share one A4, with what the two tones mean. */
function Hours({
  days,
  timeZone,
  labels,
}: {
  days: Day[];
  timeZone: string;
  labels: SeriesLabels;
}) {
  return (
    <div className="grid gap-3">
      <HoursLegend labels={labels} />
      <HoursBySchedule
        days={days}
        timeZone={timeZone}
        labels={labels}
        compact
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// The event's report: to sell the event to a new sponsor.
// ---------------------------------------------------------------------------

type EventReportProps = {
  head: Head;
  cut: Cut;
  timeZone: string;
  overview: { visitors: number; medals: number; complete: number };
  days: Day[];
  /** Org-wide: unique visitors and how many went to two or more events. */
  audience: { visitors: number; returned: number };
};

const EVENT_LABELS: SeriesLabels = {
  newcomers: "Empezaron a jugar",
  returning: "Ya estaban jugando",
};

const EVENT_NOTE =
  "Una medalla es un escaneo en un stand, una vez por visitante. Los visitantes son personas con cuenta que sacaron al menos una.";

export function EventReport(p: EventReportProps) {
  const { overview: o } = p;
  const per = medalsPerVisitor(o);
  const completed = shareOfAudience(o.complete, o.visitors);
  const returned = shareOfAudience(p.audience.returned, p.audience.visitors);
  const cells: [string, string, string?][] = [
    ["Visitantes", int.format(o.visitors)],
    ["Medallas", int.format(o.medals)],
    ["Por visitante", per === null ? "–" : dec.format(per)],
    [
      "Completaron todas",
      int.format(o.complete),
      completed === null ? undefined : `${pct.format(completed)} del público`,
    ],
  ];
  return (
    <Sheet head={p.head} cut={p.cut} note={EVENT_NOTE}>
      <StatStrip cells={cells} />
      <section className="grid gap-3">
        <SectionTitle>Afluencia</SectionTitle>
        <Hours days={p.days} timeZone={p.timeZone} labels={EVENT_LABELS} />
      </section>
      <section className="grid gap-2">
        <SectionTitle>Fidelidad</SectionTitle>
        <p>
          En los eventos de {p.head.orgName}: {int.format(p.audience.visitors)}{" "}
          visitantes únicos, y {int.format(p.audience.returned)}
          {returned === null ? "" : ` (${pct.format(returned)})`} volvieron a
          más de uno.
        </p>
      </section>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// A stand's report: for its sponsor, without naming anyone else.
// ---------------------------------------------------------------------------

type SpotReportProps = {
  head: Head;
  cut: Cut;
  timeZone: string;
  visitors: number;
  spot: {
    visits: number;
    firstStops: number;
    rank: number | null;
    stands: number;
    average: number;
  };
  /** The event's hours by schedule, and the stand's hours on top of them. */
  days: Day[];
  spotHours: readonly HourCount[];
};

const SPOT_NOTE =
  "Una visita es una medalla de este stand: alguien que escaneó su QR estando ahí. La comparación cuenta los stands activos del evento y no nombra a ninguno.";

const SPOT_LABELS: SeriesLabels = {
  newcomers: "Resto del evento",
  returning: "Este stand",
};

/** The event's hours with this stand's share marked: the stand on top, the rest under it. */
function overlay(days: Day[], spotHours: readonly HourCount[]): Day[] {
  const mine = new Map(spotHours.map((h) => [Date.parse(h.hour), h.medals]));
  return days.map((d) => ({
    startsAt: d.startsAt,
    hours: d.hours.map((h) => {
      const own = Math.min(mine.get(Date.parse(h.hour)) ?? 0, h.medals);
      return { hour: h.hour, medals: h.medals, newcomers: h.medals - own };
    }),
  }));
}

/** The stand against the average in words: «Igual», «1,5 veces» or «70 % del promedio». */
function versusSentence(ratio: number) {
  const tenths = Math.round(ratio * 10) / 10;
  if (tenths === 1) return "Igual al promedio de los stands.";
  return tenths > 1
    ? `${dec.format(tenths)} veces el promedio.`
    : `${pct.format(ratio)} del promedio.`;
}

/** This stand's visits next to the average of the stands: two bars on one scale. */
function VersusAverage({
  visits,
  average,
}: {
  visits: number;
  average: number;
}) {
  const max = Math.max(1, visits, average);
  const ratio = versusAverage(visits, average);
  const bar = (label: string, value: number, solid: boolean) => (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-px-1">{label}</span>
        <span className="font-display text-px-1 tabular-nums">
          {dec.format(value)}
        </span>
      </div>
      <div className="h-4 bg-lcd-1">
        <div
          className={solid ? "h-full bg-lcd-3" : "h-full bg-lcd-2"}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
  return (
    <div className="grid gap-3">
      {bar("Este stand", visits, true)}
      {bar("Promedio de los stands", average, false)}
      {ratio !== null && <p className="text-sm">{versusSentence(ratio)}</p>}
    </div>
  );
}

export function SpotReportSheet(p: SpotReportProps) {
  const { spot } = p;
  const share = shareOfAudience(spot.visits, p.visitors);
  const place = placeLabel(spot.rank, spot.stands);
  const cells: [string, string, string?][] = [
    ["Visitas", int.format(spot.visits)],
    [
      "Del público",
      share === null ? "–" : pct.format(share),
      `de ${int.format(p.visitors)} visitantes`,
    ],
    [
      "Primera parada",
      int.format(spot.firstStops),
      "empezaron el recorrido acá",
    ],
    ["Puesto", place ?? "–", "entre los stands activos"],
  ];
  return (
    <Sheet head={p.head} cut={p.cut} note={SPOT_NOTE}>
      <StatStrip cells={cells} />
      <section className="grid gap-3">
        <SectionTitle>Cuándo llegaron</SectionTitle>
        <Hours
          days={overlay(p.days, p.spotHours)}
          timeZone={p.timeZone}
          labels={SPOT_LABELS}
        />
      </section>
      <section className="grid gap-3">
        <SectionTitle>Contra el promedio</SectionTitle>
        <VersusAverage visits={spot.visits} average={spot.average} />
      </section>
    </Sheet>
  );
}

import Link from "next/link";
import { Chevron } from "@/components/pixel/Chevron";
import { type IconName, PixelIcon } from "@/components/pixel/icons";
import {
  type buildHistory,
  type HistoryEdition,
  STAMPS,
  type StampId,
} from "@/domain/history";

type History = ReturnType<typeof buildHistory>;

const ICON: Record<StampId, IconName> = {
  "primera-edicion": "eventos",
  "tres-seguidas": "calendario",
  "coleccion-completa": "spots",
  ganador: "trofeo",
};

/** How to earn each stamp: what the locked ones tell the visitor. */
const HINT: Record<StampId, string> = {
  "primera-edicion": "Venir a la primera edición de un evento que sigue.",
  "tres-seguidas": "Venir a tres ediciones seguidas del mismo evento.",
  "coleccion-completa": "Juntar todas las medallas de un evento.",
  ganador: "Ganar un sorteo.",
};

// shortcut: the month is read in UTC, not in the event's zone; it only shifts for an event starting in the last hours of a month, store the zone with the edition if it matters
const MONTH = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;
const editionName = (e: HistoryEdition) =>
  e.editionLabel ? `${e.title} · ${e.editionLabel}` : e.title;

const BOX = "border-2 border-lcd-3";

/**
 * The visitor's history in this organization, folded under their collection:
 * the stamps first (the ones still to earn as a goal), then what they played.
 */
export function History({
  history,
  current,
}: {
  history: History;
  /** The slug of the edition whose collection the page is showing. */
  current?: string;
}) {
  const { played, totals, since, stamps } = history;
  if (played.length === 0) {
    return (
      <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
        Todavía no tenés historial. Se arma con los eventos en los que juntes
        medallas.
      </p>
    );
  }
  const earned = new Set(stamps.map((s) => s.id));
  return (
    <section aria-label="Tu historial">
      <details className={`group ${BOX} open:panel`}>
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3">
          <span className="grid gap-1">
            <span className="font-display text-px-1">Tu historial</span>
            <span className="text-sm text-muted-foreground">
              {plural(totals.events, "evento", "eventos")} ·{" "}
              {plural(totals.medals, "medalla", "medallas")}
            </span>
          </span>
          <Chevron className="group-open:rotate-180" />
        </summary>
        <div className="grid gap-6 px-4 pb-5">
          <ul
            aria-label="Tus sellos"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {(Object.keys(STAMPS) as StampId[]).map((id) =>
              earned.has(id) ? (
                <li
                  key={id}
                  className={`grid content-start justify-items-center gap-3 ${BOX} bg-lcd-1 p-4 text-center`}
                >
                  <PixelIcon name={ICON[id]} size={40} />
                  <span className="font-display text-px-1">{STAMPS[id]}</span>
                  <span className="sr-only">Ganado</span>
                </li>
              ) : (
                <li
                  key={id}
                  className="grid content-start justify-items-center gap-3 border-2 border-dashed border-lcd-2 p-4 text-center text-muted-foreground"
                >
                  <PixelIcon name="candado" size={40} />
                  <span className="font-display text-px-1">{STAMPS[id]}</span>
                  <span className="sr-only">Por ganar:</span>
                  <span className="text-sm">{HINT[id]}</span>
                </li>
              ),
            )}
          </ul>
          <p className="max-w-prose">
            Jugaste {plural(totals.events, "evento", "eventos")}, juntaste{" "}
            {plural(totals.medals, "medalla", "medallas")} y ganaste{" "}
            {plural(totals.wins, "sorteo", "sorteos")}.
            {since && ` Venís desde ${MONTH.format(new Date(since))}.`}
          </p>
          <ul aria-label="Tus ediciones" className="grid">
            {played.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/mis-medallas?evento=${e.slug}`}
                  aria-current={e.slug === current ? "page" : undefined}
                  className="flex min-h-11 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-lcd-1 py-2 no-underline hover:bg-lcd-1 aria-[current=page]:bg-lcd-1"
                >
                  <span className="font-display text-px-1">
                    {editionName(e)}
                  </span>
                  {/* The space is for a screen reader: flex hides it, and the link's name would read "actual2 de 3". */}{" "}
                  <span className="text-sm tabular-nums">
                    {e.medals} de {plural(e.total, "medalla", "medallas")}
                    {e.wins > 0 && " · ganaste un sorteo"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}

/** While the history loads: the folded panel's shape. */
export function HistoryLoading() {
  return (
    <section aria-label="Tu historial" aria-busy>
      <p role="status" className="sr-only">
        Cargando tu historial…
      </p>
      <div aria-hidden className={`${BOX} border-dashed px-4 py-3`}>
        <span className="font-display text-px-1">Tu historial</span>
        <div className="mt-2 h-4 w-40 bg-lcd-1" />
      </div>
    </section>
  );
}

/** The collection stands without it: only this section says it failed. */
export function HistoryFailed() {
  return (
    <p
      role="alert"
      className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8"
    >
      No pudimos cargar tu historial. Volvé a abrir la página en un rato.
    </p>
  );
}

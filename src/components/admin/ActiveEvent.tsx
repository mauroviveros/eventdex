import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { LinkLabel } from "@/components/ui/LinkLabel";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import type { Phase } from "@/domain/events";

type Props = {
  org: string;
  event: {
    slug: string;
    title: string;
    edition: string | null;
    phase: Extract<Phase, "en-curso" | "proximo">;
    /** Already formatted in the event's time zone ("sáb 14 al dom 15 de nov"). */
    dates: string | null;
    venue: string | null;
    stats: { stands: number; visitors: number; medals: number };
  };
  /** Its page on the org's domain, once published. */
  publicUrl: string | null;
};

const perVisitor = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

/**
 * The event that matters today, first in the dashboard: the one in course or
 * the next one, with how it's going and the moves of the day one tap away.
 */
export function ActiveEvent({ org, event, publicUrl }: Props) {
  const base = `/panel/${org}/eventos/${event.slug}`;
  const { stands, visitors, medals } = event.stats;
  const cells: [string, string][] = [
    ["Stands", stands.toLocaleString("es-AR")],
    ["Visitantes", visitors.toLocaleString("es-AR")],
    ["Medallas", medals.toLocaleString("es-AR")],
    ["Por visitante", visitors ? perVisitor.format(medals / visitors) : "–"],
  ];

  return (
    <section className="panel grid gap-5 p-6">
      <header className="grid justify-items-start gap-2">
        <PhaseBadge phase={event.phase} />
        <h2 className="text-px-3 text-balance">
          {event.title}
          {event.edition && (
            <span className="text-muted-foreground"> {event.edition}</span>
          )}
        </h2>
        <p className="text-muted-foreground">
          {[event.dates ?? "Sin fecha", event.venue ?? "Sin sede"].join(" · ")}
        </p>
      </header>

      {/* Two by two on a phone, one row from sm; the rules follow the grid. */}
      <dl className="grid grid-cols-2 border-2 border-lcd-3 sm:grid-cols-4">
        {cells.map(([label, value], i) => (
          <div
            key={label}
            className={`grid gap-1 px-4 py-3 ${i % 2 === 0 ? "border-r-2 border-lcd-3" : ""} ${
              i > 1 ? "border-t-2 border-lcd-3 sm:border-t-0" : ""
            } ${i < 3 ? "sm:border-r-2" : ""}`}
          >
            <dt className="font-display text-px-1 text-muted-foreground">
              {label}
            </dt>
            <dd className="font-display text-px-3 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2">
        <Link href={base} className={buttonClass("primary", "no-underline")}>
          <LinkLabel label="Gestionar" pendingLabel="Abriendo…" />
        </Link>
        {stands > 0 && (
          <Link
            href={`${base}/qr`}
            className={buttonClass("secondary", "no-underline")}
          >
            Hoja de QR
          </Link>
        )}
        {event.phase === "en-curso" && (
          <Link
            href={`${base}/sorteo`}
            className={buttonClass("secondary", "no-underline")}
          >
            Sorteo
          </Link>
        )}
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonClass("secondary", "no-underline")}
          >
            Ver en el sitio
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        )}
      </div>
    </section>
  );
}

import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { LinkLabel } from "@/components/ui/LinkLabel";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import type { Phase } from "@/domain/events";
import { eventCells, StatStrip } from "./StatStrip";

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

/**
 * The event that matters today, first in the dashboard: the one in course or
 * the next one, with how it's going and the moves of the day one tap away.
 */
export function ActiveEvent({ org, event, publicUrl }: Props) {
  const base = `/panel/${org}/eventos/${event.slug}`;
  const { stands } = event.stats;

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

      <StatStrip cells={eventCells(event.stats)} />

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
            href={`${base}?tab=sorteo`}
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

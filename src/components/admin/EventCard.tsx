import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import { LinkLabel } from "@/components/ui/LinkLabel";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import type { Phase } from "@/domain/events";

type Props = {
  title: string;
  phase: Phase;
  /** Already formatted in the event's time zone ("sáb, 14 nov"). */
  dateLabel: string | null;
  venue: string | null;
  href: string;
  /** How it went: active stands, registered visitors, medals handed out. */
  stats: { stands: number; visitors: number; medals: number };
  /** The ⋮ menu next to Gestionar (EventActions). */
  actions?: ReactNode;
};

const perVisitor = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

/** An event in the organization's dashboard: where and when, how it went, and the way in. */
export function EventCard({
  title,
  phase,
  dateLabel,
  venue,
  href,
  stats,
  actions,
}: Props) {
  const draft = phase === "borrador";
  // A draft can't be visited yet: only what's loaded, and the strip dashed.
  const cells: [string, number][] = draft
    ? [["Stands", stats.stands]]
    : [
        ["Stands", stats.stands],
        ["Visitantes", stats.visitors],
        ["Medallas", stats.medals],
      ];

  return (
    <article className="grid content-start gap-5 border-2 border-lcd-3 p-5">
      <header className="grid gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-px-2">{title}</h3>
          <PhaseBadge phase={phase} />
        </div>
        <p className="text-sm text-muted-foreground">
          {[dateLabel ?? "Sin fecha", venue ?? "Sin sede"].join(" · ")}
        </p>
      </header>

      <div className="grid gap-2">
        <dl
          className={`grid border-2 ${
            draft ? "border-dashed border-lcd-2" : "grid-cols-3 border-lcd-3"
          }`}
        >
          {cells.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 px-3 py-2 not-last:border-r-2 not-last:border-lcd-3"
            >
              <dt className="font-display text-px-1 text-muted-foreground">
                {label}
              </dt>
              <dd className="font-display text-px-2 tabular-nums">
                {value.toLocaleString("es-AR")}
              </dd>
            </div>
          ))}
        </dl>
        {!draft && (
          <p className="text-sm">
            {stats.visitors === 0
              ? "Todavía sin visitantes"
              : `${perVisitor.format(stats.medals / stats.visitors)} ${
                  stats.medals === stats.visitors ? "medalla" : "medallas"
                } por visitante`}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Link
          href={href}
          className={buttonClass("primary", "flex-1 no-underline")}
        >
          <LinkLabel label="Gestionar" pendingLabel="Abriendo…" />
          {/* Each card's link says which event, for a list of links. */}
          <span className="sr-only"> {title}</span>
        </Link>
        {actions}
      </div>
    </article>
  );
}

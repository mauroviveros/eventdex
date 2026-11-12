import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { LinkLabel } from "@/components/ui/LinkLabel";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import type { Phase } from "@/domain/events";

type Stats = {
  stands: number;
  visitors: number;
  claims: number;
  /** Average share of the event's spots each visitor collected, 0–1. */
  completion: number;
  href: string;
};

type Props = {
  title: string;
  phase: Phase;
  /** Already formatted in the event's time zone ("sáb, 14 nov"). */
  dateLabel: string | null;
  venue: string | null;
  href: string;
  /** How it went. Absent until spots (R3) and claims (R5) exist: no invented zeros. */
  stats?: Stats;
};

const SEGMENTS = 10;

/** An event in the organization's dashboard: where and when, how it went, and the way in. */
export function EventCard({
  title,
  phase,
  dateLabel,
  venue,
  href,
  stats,
}: Props) {
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

      {stats && <EventStats phase={phase} {...stats} />}

      <div className={stats ? "grid grid-cols-2 gap-2" : "grid"}>
        {stats && (
          <Link
            href={stats.href}
            className={buttonClass("secondary", "no-underline")}
          >
            Estadísticas<span className="sr-only"> de {title}</span>
          </Link>
        )}
        <Link href={href} className={buttonClass("primary", "no-underline")}>
          <LinkLabel label="Gestionar" pendingLabel="Abriendo…" />
          {/* Each card's link says which event, for a list of links. */}
          <span className="sr-only"> {title}</span>
        </Link>
      </div>
    </article>
  );
}

function EventStats({
  phase,
  stands,
  visitors,
  claims,
  completion,
}: Stats & { phase: Phase }) {
  const percent = Math.round(Math.min(1, Math.max(0, completion)) * 100);
  // Any progress lights a segment; only a full 100% lights the last one.
  const lit =
    percent === 0
      ? 0
      : Math.min(
          percent < 100 ? SEGMENTS - 1 : SEGMENTS,
          Math.max(1, Math.round((percent / 100) * SEGMENTS)),
        );

  return (
    <>
      {/* One ruled strip of three cells; dashed only while the event is a draft. */}
      <dl
        className={`grid grid-cols-3 border-2 ${
          phase === "borrador" ? "border-dashed border-lcd-2" : "border-lcd-3"
        }`}
      >
        {(
          [
            ["Stands", stands],
            ["Visitantes", visitors],
            ["Medallas", claims],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className={`grid gap-1 px-3 py-2 not-last:border-r-2 ${
              phase === "borrador"
                ? "not-last:border-dashed not-last:border-lcd-2"
                : "not-last:border-lcd-3"
            }`}
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

      <div className="grid gap-2">
        <p className="flex justify-between gap-2 text-sm">
          <span>Recorrido promedio</span>
          <span className="font-display text-px-1 tabular-nums">
            {percent}%
          </span>
        </p>
        {/* biome-ignore lint/a11y/useSemanticElements: segmented LCD bar; <meter> can't be drawn in segments */}
        <div
          role="meter"
          aria-label="Recorrido promedio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`Cada visitante recorrió en promedio el ${percent}% de los stands`}
          className="flex h-4 gap-0.5 border-2 border-lcd-3 p-0.5"
        >
          {Array.from({ length: SEGMENTS }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
            <span key={i} className={`flex-1 ${i < lit ? "bg-lcd-3" : ""}`} />
          ))}
        </div>
      </div>
    </>
  );
}

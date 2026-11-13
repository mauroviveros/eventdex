import Link from "next/link";
import { PixelIcon } from "@/components/pixel/icons";

export type Draft = {
  slug: string;
  title: string;
  edition: string | null;
  hasSchedules: boolean;
  hasSpots: boolean;
  hasVenue: boolean;
};

/**
 * The org's drafts, each with what it still lacks and the next step as a link.
 * Schedules are what publishing needs; spots make the medals; the venue is
 * optional, so it never blocks.
 */
export function DraftChecklist({
  org,
  drafts,
}: {
  org: string;
  drafts: Draft[];
}) {
  return (
    <section aria-labelledby="para-publicar" className="grid gap-3">
      <h2 id="para-publicar" className="text-px-2">
        Para publicar{" "}
        <span className="text-muted-foreground tabular-nums">
          {drafts.length}
        </span>
      </h2>
      <ul className="grid border-2 border-dashed border-lcd-2">
        {drafts.map((d) => {
          const base = `/panel/${org}/eventos/${d.slug}`;
          const next = !d.hasSchedules
            ? { label: "Cargar jornadas", href: base }
            : !d.hasSpots
              ? { label: "Agregar spots", href: `${base}?tab=spots` }
              : { label: "Revisar y publicar", href: base };
          return (
            <li
              key={d.slug}
              className="grid gap-3 px-4 py-3 not-last:border-b-2 not-last:border-dashed not-last:border-lcd-2 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6"
            >
              <p className="font-display text-px-2">
                {d.title}
                {d.edition && (
                  <span className="text-muted-foreground"> {d.edition}</span>
                )}
              </p>
              <DraftSteps draft={d} />
              <Link
                href={next.href}
                className="flex min-h-11 items-center font-display text-px-1"
              >
                {next.label}
                <span className="sr-only"> de {d.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** What a draft has and lacks: schedules and spots, and the optional venue. */
export function DraftSteps({
  draft,
}: {
  draft: Pick<Draft, "hasSchedules" | "hasSpots" | "hasVenue">;
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      <Step done={draft.hasSchedules} label="Jornadas" />
      <Step done={draft.hasSpots} label="Spots" />
      <Step done={draft.hasVenue} label="Sede" optional />
    </ul>
  );
}

/** A filled check when it's there; an empty dashed cell when it's missing. */
function Step({
  done,
  label,
  optional,
}: {
  done: boolean;
  label: string;
  optional?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-2 ${done ? "" : "text-muted-foreground"}`}
    >
      {done ? (
        <PixelIcon name="check" />
      ) : (
        <span
          aria-hidden
          className="size-4 border-2 border-dashed border-current"
        />
      )}
      {label}
      {optional && !done && " (opcional)"}
      <span className="sr-only">{done ? ": listo" : ": falta"}</span>
    </li>
  );
}

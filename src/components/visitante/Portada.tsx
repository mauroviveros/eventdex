import type { ReactNode } from "react";
import {
  PORTADA_SECTIONS,
  type PortadaPhase,
  type PortadaSection,
  portadaGroups,
} from "@/domain/portada";

/** A section: a title with its body, or a body that brings its own heading. */
export type Piece = { title?: string; body: ReactNode };
export type Pieces = Partial<Record<PortadaSection, Piece>>;

type Props = {
  phase: PortadaPhase;
  pieces: Pieces;
};

/** The page's column: its sections sit in it, while the index bar spans the screen. */
export const COLUMN = "mx-auto w-full max-w-5xl px-4 sm:px-6";

// shortcut: the bar sticks under a header of 4 rem + its rule (min-h-16 in the public layout), so a taller header covers it; measure it in a variable if the header grows
// The team's preview has no public header but its own bar, and says so in --portada-top.
const BELOW_HEADER = "top-[var(--portada-top,calc(4rem+2px))]";

function Titled({ id, piece }: { id: string; piece: Piece }) {
  if (!piece.title) return piece.body;
  return (
    <section aria-labelledby={id} className="grid gap-6">
      <h2
        id={id}
        className="border-b-2 border-lcd-3 pb-2 text-px-2 sm:text-px-3"
      >
        {piece.title}
      </h2>
      {piece.body}
    </section>
  );
}

/**
 * The event's page under its banner: a sticky index of three
 * groups (Juego, El evento, Fotos) and the sections, in the order the event's
 * phase reads them. A section with nothing to show is left out, and so is a
 * group left without sections.
 */
export function Portada({ phase, pieces }: Props) {
  const groups = portadaGroups(
    phase,
    PORTADA_SECTIONS.filter((key) => pieces[key]),
  );

  return (
    <>
      <nav
        aria-label="Secciones de la portada"
        data-slot="portada-index"
        className={`sticky ${BELOW_HEADER} z-20 border-y-2 border-lcd-3 bg-background`}
      >
        <ul className="flex w-full">
          {groups.map((g) => (
            <li key={g.id} className="flex-1 border-lcd-3 not-first:border-l-2">
              <a
                href={`#${g.id}`}
                className="flex min-h-11 items-center justify-center px-2 font-display text-px-1 no-underline"
              >
                {g.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {groups.map((g) => (
        <div key={g.id} id={g.id} className={`${COLUMN} grid gap-12`}>
          {g.sections.map((key) => {
            const piece = pieces[key];
            return piece && <Titled key={key} id={key} piece={piece} />;
          })}
        </div>
      ))}
    </>
  );
}

import { PixelIcon } from "@/components/pixel/icons";
import { type Prize, prizeLadder } from "@/domain/prizes";
import type { EventPrize } from "@/lib/data/raffles";

/** A prize with what the visitor reads of it: its ladder state plus the organizer's text and picture. */
type View = Prize & { description: string | null; imageUrl?: string };

type Props = {
  prizes: readonly EventPrize[];
  /** Medals the visitor has; 0 signed out. */
  claimed: number;
  /** Stands of the event that give a medal. */
  total: number;
};

function prizeView(
  prizes: readonly EventPrize[],
  claimed: number,
  total: number,
) {
  const ladder = prizeLadder(prizes, claimed, total);
  const by = new Map(prizes.map((p) => [p.id, p]));
  const list: View[] = ladder.prizes.map((p) => ({
    ...p,
    description: by.get(p.id)?.description ?? null,
    imageUrl: by.get(p.id)?.imageUrl,
  }));
  return { ladder, list };
}

/** Whether there is anything to show: a raffle nobody can reach is hidden. */
export function hasPrizes(
  prizes: readonly EventPrize[],
  claimed: number,
  total: number,
) {
  return prizeLadder(prizes, claimed, total).prizes.length > 0;
}

function StatusTag({ status }: { status: Prize["status"] }) {
  if (status === "reached") {
    return (
      <span className="inline-flex items-center gap-2">
        <PixelIcon name="check" size={16} />
        Ya estás
      </span>
    );
  }
  if (status === "next") {
    return (
      <span className="inline-flex items-center gap-2">
        <span aria-hidden className="size-3 animate-blink bg-current" />
        Próximo
      </span>
    );
  }
  return <span>Más adelante</span>;
}

/** The medals a prize asks for, as a stamp. */
function Minimum({ n }: { n: number }) {
  return (
    <span className="grid min-w-20 content-start justify-items-center gap-1 self-start border-2 border-lcd-3 bg-plate px-2 py-2 font-display">
      <span className="font-wide text-numeral tabular-nums">{n}</span>
      <span className="text-px-1">{n === 1 ? "medalla" : "medallas"}</span>
    </span>
  );
}

function Segments({ done, of }: { done: number; of: number }) {
  return (
    <div
      role="img"
      aria-label={`${done} de ${of} medallas`}
      className="flex h-4 gap-0.5 border-2 border-lcd-3 bg-plate p-0.5"
    >
      {Array.from({ length: of }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
          key={i}
          className={`flex-1 ${i < done ? "bg-lcd-3" : ""}`}
        />
      ))}
    </div>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <h2
      id="premios"
      className="border-b-2 border-lcd-3 pb-2 text-px-2 sm:text-px-3"
    >
      {children}
    </h2>
  );
}

/**
 * The event's page: a plate per prize. With a picture it leads; without one
 * the plate is a compact row, so a prize without a photo is not a big empty tile.
 */
export function PrizesSection({ prizes, claimed, total }: Props) {
  const { list } = prizeView(prizes, claimed, total);
  if (list.length === 0) return null;
  return (
    <section aria-labelledby="premios" className="grid gap-6">
      <Heading>Premios</Heading>
      <ul className="grid gap-4 sm:grid-cols-2">
        {list.map((p) => (
          <li
            key={p.id}
            aria-current={p.status === "next" ? "step" : undefined}
            className={`grid content-start gap-3 p-4 ${
              p.status === "next" ? "panel bg-lcd-1" : "panel"
            }`}
          >
            {p.imageUrl ? (
              // biome-ignore lint/performance/noImgElement: prize images come from Storage, at most 1.5 MB
              <img
                src={p.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full border-2 border-lcd-3 object-cover"
              />
            ) : null}
            <div
              className={
                p.imageUrl ? "grid gap-1" : "grid grid-cols-[auto_1fr] gap-4"
              }
            >
              {!p.imageUrl && <Minimum n={p.minClaims} />}
              <div className="grid content-start gap-1">
                <span className="font-display text-px-1">
                  <StatusTag status={p.status} />
                </span>
                <span className="font-display text-px-2">{p.title}</span>
                {p.description && (
                  <span className="text-sm">{p.description}</span>
                )}
              </div>
            </div>
            {/* One medal is not a goal: the tag already says it. */}
            {p.minClaims > 1 && (
              <Segments
                done={Math.min(claimed, p.minClaims)}
                of={p.minClaims}
              />
            )}
            <span className="text-sm">{p.phrase}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Mis medallas: the ladder from lowest to highest, the next prize lit as a filled plate. */
export function PrizesLadder({ prizes, claimed, total }: Props) {
  const { list } = prizeView(prizes, claimed, total);
  if (list.length === 0) return null;
  return (
    <section aria-labelledby="premios" className="grid gap-6">
      <Heading>Premios</Heading>
      <ol className="grid gap-3">
        {list.map((p) => (
          <li
            key={p.id}
            aria-current={p.status === "next" ? "step" : undefined}
            className={`grid grid-cols-[auto_1fr] items-start gap-4 px-4 py-4 ${
              p.status === "next"
                ? "panel bg-lcd-1"
                : p.status === "reached"
                  ? "border-2 border-lcd-3"
                  : "border-2 border-dashed border-lcd-2"
            }`}
          >
            <Minimum n={p.minClaims} />
            <span className="grid gap-1">
              <span className="font-display text-px-2">{p.title}</span>
              {p.description && (
                <span className="text-sm">{p.description}</span>
              )}
              <span className="font-display text-px-1">
                <StatusTag status={p.status} />
              </span>
              <span className="text-sm">{p.phrase}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * The collection's bar with a cup where each prize opens. A prize of one medal
 * has no cup: at the very start of a long bar it says nothing.
 */
// shortcut: two prizes with the same minimum share a column, the plate under tells them apart; revisit if staff does it often
export function PrizeBar({ prizes, claimed, total }: Props) {
  const { list } = prizeView(prizes, claimed, total);
  const cups = list.filter((p) => p.minClaims > 1);
  return (
    <div className="grid gap-1">
      <p className="flex items-baseline gap-2 font-display">
        <span className="font-wide text-numeral tabular-nums">{claimed}</span>
        <span className="text-px-1 text-muted-foreground">
          de {total} {total === 1 ? "medalla" : "medallas"}
        </span>
      </p>
      <div
        role="progressbar"
        aria-label="Medallas juntadas"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={claimed}
        aria-valuetext={`${claimed} de ${total} medallas`}
        className="flex h-5 gap-0.5 border-2 border-lcd-3 bg-plate p-0.5 shadow-plate"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
            key={i}
            className={`flex-1 ${i < claimed ? "bg-lcd-3" : ""}`}
          />
        ))}
      </div>
      {cups.length > 0 && (
        <div
          aria-hidden
          className="grid"
          style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        >
          {cups.map((p) => (
            <span
              key={p.id}
              style={{ gridColumn: p.minClaims, gridRow: 1 }}
              className={`justify-self-end ${p.status === "later" ? "text-muted-foreground" : "text-accent-yellow"}`}
            >
              <PixelIcon name="trofeo" size={20} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * What the celebration shows under a new or repeated medal, instead of the
 * plain progress: the bar with its cups, and the closest prize with its phrase.
 */
export function PrizeNotice({ prizes, claimed, total }: Props) {
  const { ladder } = prizeView(prizes, claimed, total);
  const focus = ladder.next ?? ladder.reached;
  if (!focus) return null;
  return (
    <div className="grid gap-4">
      <PrizeBar prizes={prizes} claimed={claimed} total={total} />
      <div className="panel grid grid-cols-[auto_1fr] items-center gap-4 p-3">
        <span className="grid size-16 place-items-center border-2 border-dashed border-lcd-2 text-accent-yellow">
          <PixelIcon name="trofeo" size={32} />
        </span>
        <span className="grid gap-1">
          <span className="font-display text-px-1">
            <StatusTag status={focus.status} />
          </span>
          <span className="font-display text-px-2">{focus.title}</span>
        </span>
        <p className="col-span-2 text-sm">{focus.phrase}</p>
      </div>
    </div>
  );
}

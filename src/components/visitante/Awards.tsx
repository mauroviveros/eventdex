import { PixelIcon } from "@/components/pixel/icons";
import { type AwardInput, awardView, reachableAwards } from "@/domain/awards";
import type { EventAward } from "@/lib/data/awards";

type Plates = {
  awards: readonly EventAward[];
  /** Medals the visitor has; 0 signed out. */
  claimed: number;
  /** Active stands of the event. */
  total: number;
  /** The place the visitor took in each award they won. */
  places: ReadonlyMap<string, number>;
};

/** Whether there is any award to show: one the event cannot reach is left out. */
export const hasAwards = (awards: readonly EventAward[], total: number) =>
  reachableAwards(awards, total).length > 0;

/** The places of an award as cells, the taken ones filled. */
function SlotCells({ of, taken }: { of: number; taken: number }) {
  // Past fifty the cells stop being a picture: the tag already says the number.
  if (of > 50) return null;
  return (
    <div
      role="img"
      aria-label={`${Math.min(taken, of)} de ${of} lugares ocupados`}
      className="flex h-4 gap-0.5 border-2 border-lcd-3 bg-plate p-0.5"
    >
      {Array.from({ length: of }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional
          key={i}
          className={`flex-1 ${i < taken ? "bg-lcd-3" : ""}`}
        />
      ))}
    </div>
  );
}

/**
 * The merit awards of the event, a plate each: how many places are left, what
 * it asks and, once won, the place the visitor took. Full ones go dashed.
 */
export function AwardPlates({ awards, claimed, total, places }: Plates) {
  const shown = reachableAwards(awards, total);
  if (shown.length === 0) return null;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {shown.map((a) => {
        const v = awardView(
          a as AwardInput,
          claimed,
          total,
          places.get(a.id) ?? null,
        );
        return (
          <li
            key={a.id}
            className={`grid content-start gap-2 p-4 ${
              v.state === "agotado"
                ? "border-2 border-dashed border-lcd-2"
                : v.state === "ganado"
                  ? "panel bg-lcd-1"
                  : "panel"
            }`}
          >
            <span className="inline-flex items-center gap-2 font-display text-px-1">
              {v.state === "ganado" && <PixelIcon name="trofeo" size={16} />}
              {v.tag}
            </span>
            <span className="font-display text-px-2">{a.title}</span>
            {a.slots !== null && v.state !== "agotado" && (
              <SlotCells of={a.slots} taken={a.taken} />
            )}
            {a.description && <span className="text-sm">{a.description}</span>}
            <span className="text-sm">{v.phrase}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Under the progress of a medal that won nothing: the merit award closest to
 * the visitor, so the next scan has a reason. Nothing when there is none open.
 */
export function AwardNext({ awards, claimed, total, places }: Plates) {
  const open = reachableAwards(awards, total)
    .filter((a) => !places.has(a.id))
    .map((a) => ({ a, v: awardView(a as AwardInput, claimed, total, null) }))
    .filter(({ v }) => v.state === "abierto")
    .sort((x, y) => x.v.missing - y.v.missing);
  const next = open[0];
  if (!next) return null;
  return (
    <div className="grid gap-1 border-2 border-dashed border-lcd-3 p-3">
      <span className="inline-flex items-center gap-2 font-display text-px-1">
        <PixelIcon name="trofeo" size={16} />
        {next.v.tag}
      </span>
      <span className="font-display text-px-2">{next.a.title}</span>
      <span className="text-sm">{next.v.phrase}</span>
    </div>
  );
}

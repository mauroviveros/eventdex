import type { SpotType } from "@/domain/spots";
import { SPRITES } from "./sprites";

export type SpriteMode = "lleno" | "silueta" | "inactivo" | "revelando";

type Props = {
  type: SpotType;
  mode?: SpriteMode;
  /** Rendered size of one pixel, in px. */
  scale?: number;
  /** Empty when the text next to it already says what it is. */
  label: string;
};

export function Sprite({ type, mode = "lleno", scale = 6, label }: Props) {
  const rows = SPRITES[type];
  const size = rows.length;
  return (
    <svg
      className="sprite shrink-0"
      data-mode={mode}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      width={size * scale}
      height={size * scale}
      viewBox={`0 0 ${size} ${size}`}
    >
      {rows.flatMap((row, y) =>
        [...row].map((px, x) => {
          if (px === ".") return null;
          // An inactive spot is dithered: every other pixel drops out.
          if (mode === "inactivo" && (x + y) % 2 === 1) return null;
          return (
            <rect
              // biome-ignore lint/suspicious/noArrayIndexKey: pixels never reorder
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              data-t={px}
            />
          );
        }),
      )}
    </svg>
  );
}

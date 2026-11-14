import { PixelIcon } from "@/components/pixel/icons";
import { Logo } from "@/components/pixel/Logo";
import { Sprite, type SpriteMode } from "@/components/pixel/Sprite";
import type { SpotType } from "@/domain/spots";

export const SPOT_STATES = [
  "oculto",
  "bloqueado",
  "pendiente",
  "nuevo",
  "conseguido",
  "inactivo",
] as const;
export type SpotState = (typeof SPOT_STATES)[number];

/** The cell, the pixel scale of its 12×12 sprite and the padlock over a locked one. */
const SIZES = {
  xs: { box: "size-10", scale: 2, lock: 0 },
  sm: { box: "size-24", scale: 6, lock: 32 },
  md: { box: "size-36", scale: 9, lock: 36 },
  lg: { box: "size-40", scale: 11, lock: 44 },
} as const;
export type SpotSize = keyof typeof SIZES;

const MODE: Record<SpotState, SpriteMode> = {
  oculto: "silueta",
  bloqueado: "silueta",
  pendiente: "silueta",
  nuevo: "revelando",
  conseguido: "lleno",
  inactivo: "inactivo",
};

/**
 * Solid is yours (conseguido, nuevo); dashed is not yet. The ground under a
 * dashed one stays at the lightest tone so the silhouette reads.
 */
const FRAME: Record<SpotState, string> = {
  conseguido: "border-lcd-3 bg-plate shadow-plate",
  nuevo: "border-lcd-3 bg-plate",
  oculto: "border-dashed border-lcd-2 bg-lcd-1",
  bloqueado: "border-dashed border-lcd-2 bg-lcd-0",
  pendiente: "border-dashed border-lcd-2 bg-lcd-0",
  inactivo: "border-dashed border-lcd-2 bg-lcd-0",
};

type Props = {
  state: SpotState;
  size: SpotSize;
  type: SpotType;
  /** The spot's logo. Without one, the sprite of its type. */
  logo?: string;
  /** What a screen reader says; empty where the text next to it already does. */
  label?: string;
};

/**
 * The one way a spot is drawn: every state, every size. A hidden spot is an
 * empty cell; a locked one is always the sprite in silhouette under a padlock,
 * even with a logo, since the logo is what the reveal gives.
 */
export function Spot({ state, size, type, logo, label }: Props) {
  const { box, scale, lock } = SIZES[size];
  const showLogo = logo && state !== "oculto" && state !== "bloqueado";
  return (
    <div
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
      className="relative shrink-0"
    >
      <div
        className={`grid ${box} place-items-center overflow-hidden border-2 ${FRAME[state]}`}
      >
        {state === "oculto" ? null : showLogo ? (
          <Logo src={logo} mode={MODE[state]} label="" />
        ) : (
          <Sprite type={type} scale={scale} mode={MODE[state]} label="" />
        )}
      </div>
      {state === "bloqueado" && lock > 0 && (
        <span className="absolute inset-0 grid place-items-center text-lcd-3">
          <PixelIcon name="candado" size={lock} />
        </span>
      )}
    </div>
  );
}

import { Sprite, type SpriteMode } from "@/components/pixel/Sprite";
import type { SpotType } from "@/domain/spots";

export type MedalState = "conseguida" | "pendiente" | "nueva" | "inactiva";

const MODE: Record<MedalState, SpriteMode> = {
  conseguida: "lleno",
  pendiente: "silueta",
  nueva: "revelando",
  inactiva: "inactivo",
};

const STATUS: Record<MedalState, string> = {
  conseguida: "Conseguida",
  pendiente: "Te falta",
  nueva: "¡Nueva!",
  inactiva: "Spot inactivo",
};

type Props = {
  name: string;
  code: string;
  type: SpotType;
  state: MedalState;
  /** The spot's logo. Without one, the medal is the sprite of its type. */
  logo?: string;
};

/** One spot in the visitor's collection. */
export function Medal({ name, code, type, state, logo }: Props) {
  const muted = state === "pendiente" || state === "inactiva";
  const label = `${name}: ${STATUS[state]}`;
  return (
    <figure className="grid w-32 justify-items-center gap-2 text-center">
      <div
        className={`grid size-24 place-items-center overflow-hidden border-2 ${
          muted ? "border-dashed border-lcd-2" : "border-lcd-3"
        } ${state === "nueva" ? "bg-lcd-1" : ""}`}
      >
        {logo ? (
          <Logo src={logo} mode={MODE[state]} label={label} />
        ) : (
          <Sprite type={type} mode={MODE[state]} label={label} />
        )}
      </div>
      <figcaption className="grid gap-1">
        <span className="font-display text-px-1 text-muted-foreground">
          {code}
        </span>
        <span
          className={`text-sm leading-tight ${muted ? "text-muted-foreground" : ""}`}
        >
          {name}
        </span>
        <span className="font-display text-px-1">{STATUS[state]}</span>
      </figcaption>
    </figure>
  );
}

/** A logo posterized into the ramp (filters in LcdFilters.tsx). */
export function Logo({
  src,
  mode,
  label,
  className = "size-full",
}: {
  src: string;
  mode: SpriteMode;
  label: string;
  className?: string;
}) {
  return (
    // biome-ignore lint/performance/noImgElement: logos come from Storage and go through an SVG filter; next/image adds nothing here
    <img
      src={src}
      alt={label}
      data-mode={mode}
      className={`logo object-cover ${className}`}
    />
  );
}

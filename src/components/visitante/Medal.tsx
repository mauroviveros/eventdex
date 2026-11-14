import type { SpotType } from "@/domain/spots";
import { Spot, type SpotState } from "./Spot";

const STATUS: Record<SpotState, string> = {
  oculto: "Oculta",
  bloqueado: "Bloqueada",
  pendiente: "Te falta",
  nuevo: "¡Nueva!",
  conseguido: "Conseguida",
  inactivo: "Spot inactivo",
};

type Props = {
  name: string;
  code: string;
  type: SpotType;
  state: SpotState;
  /** The spot's logo. Without one, the medal is the sprite of its type. */
  logo?: string;
};

/** One spot in the visitor's collection. The caption says it all: the picture stays silent. */
export function Medal({ name, code, type, state, logo }: Props) {
  const muted = state !== "conseguido" && state !== "nuevo";
  return (
    <figure className="grid w-32 justify-items-center gap-2 text-center">
      <Spot state={state} size="sm" type={type} logo={logo} />
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

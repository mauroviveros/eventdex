import type { ReactNode } from "react";
import { AlertIcon } from "@/components/pixel/AlertIcon";
import { Sprite, type SpriteMode } from "@/components/pixel/Sprite";
import { Button } from "@/components/ui/Button";
import type { SpotType } from "@/domain/spots";
import { Logo } from "./Medal";

export type ClaimOutcome =
  | { kind: "nueva" }
  | { kind: "repetida"; claimedAt: string }
  | { kind: "inactivo" }
  | { kind: "fuera-de-fase"; startsAt: string }
  | { kind: "bloqueado" };

type Props = {
  spot: { name: string; code: string; type: SpotType; logo?: string };
  outcome: ClaimOutcome;
  /** Progress block shown under a new or repeated medal. */
  progress?: ReactNode;
  /** 1 on /s/[id]; lower where it sits under other headings (the catalog). */
  headingLevel?: 1 | 2 | 3;
};

const MODE: Record<ClaimOutcome["kind"], SpriteMode> = {
  nueva: "revelando",
  repetida: "lleno",
  inactivo: "inactivo",
  "fuera-de-fase": "silueta",
  bloqueado: "silueta",
};

/** What the visitor sees at /s/[id] after scanning a QR. */
export function Celebration({
  spot,
  outcome,
  progress,
  headingLevel = 1,
}: Props) {
  const copy = COPY[outcome.kind](outcome as never);
  const blocked = outcome.kind === "bloqueado";
  const Heading = `h${headingLevel}` as const;
  const mode = MODE[outcome.kind];
  return (
    <article className="panel grid w-full max-w-sm justify-items-center gap-5 px-6 py-8 text-center">
      <div aria-live="polite" className="grid justify-items-center gap-4">
        {!blocked &&
          (spot.logo ? (
            <div className="size-32 border-2 border-lcd-3">
              <Logo src={spot.logo} mode={mode} label={spot.name} />
            </div>
          ) : (
            <Sprite type={spot.type} scale={10} mode={mode} label={spot.name} />
          ))}
        <Heading
          className={`flex items-center gap-2 ${headingLevel === 1 ? "text-px-3" : "text-px-2"} ${blocked ? "text-danger" : ""}`}
        >
          {blocked && <AlertIcon size={24} />}
          {copy.title}
        </Heading>
        <p className="font-display text-px-1 text-muted-foreground">
          {spot.code} · {spot.name}
        </p>
        <p className="text-base">{copy.body}</p>
      </div>
      {progress &&
        (outcome.kind === "nueva" || outcome.kind === "repetida") && (
          <div className="w-full border-t-2 border-lcd-3 pt-5 text-left">
            {progress}
          </div>
        )}
      <Button
        variant={copy.primary ? "primary" : "secondary"}
        className="w-full"
      >
        {copy.action}
      </Button>
    </article>
  );
}

type Copy = { title: string; body: string; action: string; primary: boolean };

const COPY: {
  [K in ClaimOutcome["kind"]]: (o: Extract<ClaimOutcome, { kind: K }>) => Copy;
} = {
  nueva: () => ({
    title: "¡Medalla nueva!",
    body: "Quedó guardada en tu colección.",
    action: "Ver mis medallas",
    primary: true,
  }),
  repetida: (o) => ({
    title: "Esta ya la tenías",
    body: `La conseguiste el ${o.claimedAt}. Buscá un stand nuevo para sumar.`,
    action: "Ver mis medallas",
    primary: true,
  }),
  inactivo: () => ({
    title: "Este spot no suma",
    body: "No está activo en este evento. Probá con otro stand.",
    action: "Ver el mapa de stands",
    primary: false,
  }),
  "fuera-de-fase": (o) => ({
    title: "Todavía no arrancó",
    body: `Las medallas se suman durante el evento. Volvé el ${o.startsAt}.`,
    action: "Ver el evento",
    primary: false,
  }),
  bloqueado: () => ({
    title: "No podés sumar medallas",
    body: "Tu registro en este evento está suspendido. Si creés que es un error, hablá con la organización en el predio.",
    action: "Ir al inicio",
    primary: false,
  }),
};

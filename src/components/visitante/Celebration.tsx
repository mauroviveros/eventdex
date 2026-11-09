import Link from "next/link";
import type { ReactNode } from "react";
import { AlertIcon } from "@/components/pixel/AlertIcon";
import { Sprite, type SpriteMode } from "@/components/pixel/Sprite";
import { buttonClass } from "@/components/ui/Button";
import type { ClaimResult } from "@/domain/claims";
import { formatMoment } from "@/domain/events";
import type { SpotType } from "@/domain/spots";
import { Logo } from "./Medal";

type Props = {
  spot: { name: string; code: string; type: SpotType; logo?: string };
  outcome: ClaimResult;
  /** Dates show in the event's zone, wherever the visitor is. */
  timeZone: string;
  /** The event's page, for the outcomes that send the visitor back to it. */
  eventHref: string;
  /** Progress block shown under a new or repeated medal. */
  progress?: ReactNode;
  /** 1 on /s/[id]; lower where it sits under other headings (the catalog). */
  headingLevel?: 1 | 2 | 3;
};

const MODE: Record<ClaimResult["kind"], SpriteMode> = {
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
  timeZone,
  eventHref,
  progress,
  headingLevel = 1,
}: Props) {
  const copy = copyFor(
    outcome,
    (iso) => formatMoment(iso, timeZone),
    eventHref,
  );
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
          className={`flex items-center gap-2 ${headingLevel === 1 ? "font-wide text-title" : "text-px-2"} ${blocked ? "text-danger" : ""}`}
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
      <Link
        href={copy.href}
        className={buttonClass(
          copy.primary ? "primary" : "secondary",
          "w-full no-underline",
        )}
      >
        {copy.action}
      </Link>
    </article>
  );
}

type Copy = {
  title: string;
  body: string;
  action: string;
  href: string;
  primary: boolean;
};

const COLLECTION = "/mis-medallas";

function copyFor(
  o: ClaimResult,
  moment: (iso: string) => string,
  eventHref: string,
): Copy {
  switch (o.kind) {
    case "nueva":
      return {
        title: "¡Medalla nueva!",
        body: "Quedó guardada en tu colección.",
        action: "Ver mis medallas",
        href: COLLECTION,
        primary: true,
      };
    case "repetida":
      return {
        title: "Esta ya la tenías",
        body: `La conseguiste el ${moment(o.claimedAt)}. Buscá un stand nuevo para sumar.`,
        action: "Ver mis medallas",
        href: COLLECTION,
        primary: true,
      };
    case "inactivo":
      return {
        title: "Este spot no suma",
        body: "No está activo en este evento. Probá con otro stand.",
        action: "Ver los stands",
        href: `${eventHref}#medallas`,
        primary: false,
      };
    case "fuera-de-fase":
      return o.ended
        ? {
            title: "El evento terminó",
            body: `Las medallas se sumaban hasta el ${moment(o.endsAt)}. Las que juntaste siguen en tu colección.`,
            action: "Ver mis medallas",
            href: COLLECTION,
            primary: false,
          }
        : {
            title: "Todavía no arrancó",
            body: `Las medallas se suman durante el evento. Volvé el ${moment(o.startsAt)}.`,
            action: "Ver el evento",
            href: eventHref,
            primary: false,
          };
    case "bloqueado":
      return {
        title: "No podés sumar medallas",
        body: "Tu registro en este evento está suspendido. Si creés que es un error, hablá con la organización en el predio.",
        action: "Ir al inicio",
        href: "/",
        primary: false,
      };
  }
}

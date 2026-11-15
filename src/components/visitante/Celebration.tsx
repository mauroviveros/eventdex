import Link from "next/link";
import type { ReactNode } from "react";
import { AlertIcon } from "@/components/pixel/AlertIcon";
import { buttonClass } from "@/components/ui/Button";
import type { ClaimResult } from "@/domain/claims";
import { formatMoment } from "@/domain/events";
import type { SpotType } from "@/domain/spots";
import { Spot, type SpotState } from "./Spot";

type Props = {
  spot: { name: string; code: string; type: SpotType; logo?: string };
  outcome: ClaimResult;
  /** Dates show in the event's zone, wherever the visitor is. */
  timeZone: string;
  /** The event's page, for the outcomes that send the visitor back to it. */
  eventHref: string;
  /** Mis medallas opened on this event: a scanned QR may not be the active one. */
  collectionHref?: string;
  /** Progress block shown under a new or repeated medal. */
  progress?: ReactNode;
  /** The stand's perk: the coupon with a new medal, a pointer to its sheet with a repeated one. */
  perk?: ReactNode;
  /** 1 on /s/[id]; lower where it sits under other headings (the catalog). */
  headingLevel?: 1 | 2 | 3;
};

const STATE: Record<ClaimResult["kind"], SpotState> = {
  nueva: "nuevo",
  repetida: "conseguido",
  inactivo: "inactivo",
  "fuera-de-fase": "pendiente",
  bloqueado: "bloqueado",
};

/** What the visitor sees at /s/[id] after scanning a QR. */
export function Celebration({
  spot,
  outcome,
  timeZone,
  eventHref,
  collectionHref = "/mis-medallas",
  progress,
  perk,
  headingLevel = 1,
}: Props) {
  const copy = copyFor(
    outcome,
    (iso) => formatMoment(iso, timeZone),
    eventHref,
    collectionHref,
  );
  const blocked = outcome.kind === "bloqueado";
  const Heading = `h${headingLevel}` as const;
  return (
    <article className="panel grid w-full max-w-sm justify-items-center gap-5 px-6 py-8 text-center">
      <div className="grid justify-items-center gap-4">
        {!blocked && (
          <Spot
            state={STATE[outcome.kind]}
            size="lg"
            type={spot.type}
            logo={spot.logo}
            label={spot.name}
          />
        )}
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
      {perk && (outcome.kind === "nueva" || outcome.kind === "repetida") && (
        <div className="w-full">{perk}</div>
      )}
      {progress &&
        (outcome.kind === "nueva" || outcome.kind === "repetida") && (
          <div className="w-full border-t-2 border-lcd-3 pt-5 text-left">
            {progress}
          </div>
        )}
      <Link
        href={copy.href}
        className={buttonClass(
          // The next step is walking to another stand, not this button.
          "secondary",
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
};

function copyFor(
  o: ClaimResult,
  moment: (iso: string) => string,
  eventHref: string,
  collectionHref: string,
): Copy {
  switch (o.kind) {
    case "nueva":
      return {
        title: "¡Medalla nueva!",
        body: "Quedó guardada en tu colección.",
        action: "Ver mis medallas",
        href: collectionHref,
      };
    case "repetida":
      return {
        title: "Esta ya la tenías",
        body: `La conseguiste el ${moment(o.claimedAt)}. Buscá un stand nuevo para sumar.`,
        action: "Ver mis medallas",
        href: collectionHref,
      };
    case "inactivo":
      return {
        title: "Este spot no suma",
        body: "No está activo en este evento. Probá con otro stand.",
        action: "Ver los stands",
        href: `${eventHref}#medallas`,
      };
    case "fuera-de-fase":
      return o.ended
        ? {
            title: "El evento terminó",
            body: `Las medallas se sumaban hasta el ${moment(o.endsAt)}. Las que juntaste siguen en tu colección.`,
            action: "Ver mis medallas",
            href: collectionHref,
          }
        : {
            title: "Todavía no arrancó",
            body: `Las medallas se suman durante el evento. Volvé el ${moment(o.startsAt)}.`,
            action: "Ver el evento",
            href: eventHref,
          };
    case "bloqueado":
      return {
        title: "No podés sumar medallas",
        body: "Tu registro en este evento está suspendido. Si creés que es un error, hablá con la organización en el predio.",
        action: "Ir al inicio",
        href: "/",
      };
  }
}

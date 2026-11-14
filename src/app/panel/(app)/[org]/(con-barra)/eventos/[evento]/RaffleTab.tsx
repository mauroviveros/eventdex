import Link from "next/link";
import { RaffleDraw } from "@/components/panel/RaffleDraw";
import { ActionButton } from "@/components/ui/ActionButton";
import { buttonClass } from "@/components/ui/Button";
import { onlyFirstMedal } from "@/domain/prizes";
import {
  drawRaffleAction,
  publishRaffleWinnersAction,
} from "@/lib/actions/raffles";
import { prizeImageUrl } from "@/lib/data/organizations";
import type { EventRaffle } from "@/lib/data/raffles";
import { PrizeForm } from "./PrizeForm";
import { NewRaffleForm, VoidDrawForm } from "./RaffleForms";

const participants = (n: number) =>
  `${n.toLocaleString("es-AR")} ${n === 1 ? "participante" : "participantes"}`;

/**
 * The event's Sorteo tab: create a raffle per prize, draw on stage, void,
 * publish the winners. Read-only in support mode.
 */
export function RaffleTab({
  org,
  eventId,
  eventSlug,
  timezone,
  raffles,
  totalSpots,
  support,
}: {
  org: { slug: string; id: string };
  eventId: string;
  eventSlug: string;
  timezone: string;
  raffles: EventRaffle[];
  /** Active stands: a prize asking for more medals than this can never be won. */
  totalSpots: number;
  support: boolean;
}) {
  const minimums = raffles.map((r) => ({
    id: r.id,
    title: r.title,
    minClaims: r.min_claims,
  }));
  return (
    <>
      <p className="max-w-prose">
        Participan los visitantes con medallas que no estén bloqueados. Cada
        extracción queda registrada: se puede anular, pero no borrar.
      </p>

      {!support && onlyFirstMedal(minimums, totalSpots) && (
        <p className="max-w-prose border-2 border-lcd-3 px-4 py-3">
          Con este mínimo, el sorteo solo motiva el primer escaneo. Subí el
          mínimo, o sumá otro premio que pida más medallas, para que recorran
          más stands.
        </p>
      )}

      {raffles.length === 0 ? (
        <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
          <p className="font-display text-px-2">Todavía no hay sorteos</p>
          <p>
            {support
              ? "Cuando el equipo cree uno, aparece acá."
              : "Creá uno por cada premio que quieras sortear."}
          </p>
        </div>
      ) : (
        raffles.map((raffle) => (
          <Raffle
            key={raffle.id}
            raffle={raffle}
            org={org.slug}
            eventSlug={eventSlug}
            timezone={timezone}
            readOnly={support}
            totalSpots={totalSpots}
            orgRef={org}
          />
        ))
      )}

      {!support && (
        <section
          aria-labelledby="nuevo-sorteo"
          className="grid max-w-prose gap-4"
        >
          <h2 id="nuevo-sorteo" className="text-px-2">
            Nuevo sorteo
          </h2>
          <NewRaffleForm org={org} eventId={eventId} />
        </section>
      )}
    </>
  );
}

function Raffle({
  raffle,
  org,
  eventSlug,
  timezone,
  readOnly,
  totalSpots,
  orgRef,
}: {
  raffle: EventRaffle;
  org: string;
  eventSlug: string;
  timezone: string;
  readOnly: boolean;
  totalSpots: number;
  orgRef: { slug: string; id: string };
}) {
  const fields = { org, raffleId: raffle.id };
  const hasWinner = raffle.draws.some((d) => d.voided_at === null);
  const published = raffle.winners_published_at !== null;

  return (
    <section
      aria-labelledby={`sorteo-${raffle.id}`}
      className="grid gap-4 border-2 border-lcd-3 p-4 sm:p-6"
    >
      <div className="grid gap-1">
        <h2 id={`sorteo-${raffle.id}`} className="text-px-2 sm:text-px-3">
          {raffle.title}
        </h2>
        <p>
          {raffle.min_claims === 1
            ? "Alcanza con una medalla"
            : `Hacen falta ${raffle.min_claims.toLocaleString("es-AR")} medallas`}
          {" · "}
          {raffle.eligible === 0
            ? "nadie para sortear por ahora"
            : `${participants(raffle.eligible)} para sortear`}
        </p>
        {raffle.min_claims > totalSpots && (
          <p className="font-display text-px-1 text-danger">
            Pide más medallas que stands activos: los visitantes no ven este
            premio y nadie puede ganarlo.
          </p>
        )}
        {published && (
          <p className="font-display text-px-1">
            Ganadores publicados en la app
          </p>
        )}
      </div>

      {!readOnly && (raffle.eligible > 0 || (hasWinner && !published)) && (
        <div className="flex flex-wrap items-start gap-3">
          {raffle.eligible > 0 && (
            <>
              <ActionButton
                action={drawRaffleAction}
                fields={fields}
                label={hasWinner ? "Sacar otro ganador" : "Sacar ganador"}
                pendingLabel="Sorteando…"
                variant="primary"
              />
              <Link
                href={`/panel/${org}/eventos/${eventSlug}/sorteo/proyectar?sorteo=${raffle.id}`}
                aria-label={`Proyectar ${raffle.title}`}
                className={buttonClass("secondary", "no-underline")}
              >
                Proyectar
              </Link>
            </>
          )}
          {hasWinner && !published && (
            <ActionButton
              action={publishRaffleWinnersAction}
              fields={fields}
              label="Publicar ganadores"
              pendingLabel="Publicando…"
              confirm={{
                message:
                  "Van a aparecer en la app del evento con su nombre y la inicial del apellido.",
                label: "Sí, publicar",
              }}
            />
          )}
        </div>
      )}

      {!readOnly && (
        <details className="grid gap-3">
          <summary
            aria-label={`Descripción e imagen de ${raffle.title}`}
            className={buttonClass(
              "secondary",
              "w-fit cursor-pointer list-none",
            )}
          >
            Descripción e imagen
          </summary>
          <div className="mt-3 max-w-prose">
            <PrizeForm
              org={orgRef}
              raffleId={raffle.id}
              description={raffle.description}
              image={prizeImageUrl(raffle.image_path)}
            />
          </div>
        </details>
      )}

      {/* Always mounted: a live region added along with its content stays silent. */}
      <div aria-live="polite">
        {raffle.draws.length > 0 && (
          <ul className="grid">
            {raffle.draws.map((draw) => (
              <RaffleDraw key={draw.id} draw={draw} timezone={timezone}>
                {!readOnly && draw.voided_at === null && (
                  <VoidDrawForm org={org} drawId={draw.id} name={draw.name} />
                )}
              </RaffleDraw>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

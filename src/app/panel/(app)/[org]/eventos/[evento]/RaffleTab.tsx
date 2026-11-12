import { RaffleDraw } from "@/components/admin/RaffleDraw";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  drawRaffleAction,
  publishRaffleWinnersAction,
} from "@/lib/actions/raffles";
import type { EventRaffle } from "@/lib/data/raffles";
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
  timezone,
  raffles,
  support,
}: {
  org: { slug: string; id: string };
  eventId: string;
  timezone: string;
  raffles: EventRaffle[];
  support: boolean;
}) {
  return (
    <>
      <p className="max-w-prose">
        Participan los visitantes con medallas que no estén bloqueados. Cada
        extracción queda registrada: se puede anular, pero no borrar.
      </p>

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
            timezone={timezone}
            readOnly={support}
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
  timezone,
  readOnly,
}: {
  raffle: EventRaffle;
  org: string;
  timezone: string;
  readOnly: boolean;
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
        {published && (
          <p className="font-display text-px-1">
            Ganadores publicados en la app
          </p>
        )}
      </div>

      {!readOnly && (raffle.eligible > 0 || (hasWinner && !published)) && (
        <div className="flex flex-wrap items-start gap-3">
          {raffle.eligible > 0 && (
            <ActionButton
              action={drawRaffleAction}
              fields={fields}
              label={hasWinner ? "Sacar otro ganador" : "Sacar ganador"}
              pendingLabel="Sorteando…"
              variant="primary"
            />
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

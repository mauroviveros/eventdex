import { ActionButton } from "@/components/ui/ActionButton";
import { buttonClass } from "@/components/ui/Button";
import { awardNeeded } from "@/domain/awards";
import { formatMoment } from "@/domain/events";
import { deleteAwardAction } from "@/lib/actions/awards";
import type { AwardWinner, EventAward } from "@/lib/data/awards";
import { EditAwardForm, NewAwardForm } from "./AwardForms";

const medals = (n: number) =>
  `${n.toLocaleString("es-AR")} ${n === 1 ? "medalla" : "medallas"}`;

/** What the award asks, with the medals a percentage comes to. */
function rule(a: EventAward, totalSpots: number) {
  const needed = awardNeeded(a, totalSpots);
  return a.kind === "count"
    ? medals(needed)
    : `${a.threshold} % de las medallas (${medals(needed)})`;
}

/**
 * Merit awards of the event, in the Sorteo tab: created with a rule (medals or
 * a percentage, and an optional cap), won on scan, with who won each in order,
 * to hand it over. The rule is not edited once created; an award nobody won is
 * removed and made again. Read-only in support mode.
 */
export function AwardsBlock({
  org,
  eventId,
  timezone,
  awards,
  winners,
  totalSpots,
  support,
}: {
  org: { slug: string; id: string };
  eventId: string;
  timezone: string;
  awards: readonly EventAward[];
  winners: readonly AwardWinner[];
  /** Active stands: an award asking for more medals than this can never be won. */
  totalSpots: number;
  support: boolean;
}) {
  return (
    <section aria-labelledby="premios-merito" className="grid gap-6">
      <div className="grid max-w-prose gap-2">
        <h2 id="premios-merito" className="text-px-2 sm:text-px-3">
          Premios por mérito
        </h2>
        <p>
          Se ganan solos al juntar medallas, sin sorteo: «los primeros 5 en
          completar todas», «los que lleguen a la mitad». El visitante lo ve al
          escanear y pasa por la organización a retirarlo.
        </p>
      </div>

      {awards.length === 0 ? (
        <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
          <p className="font-display text-px-2">
            Todavía no hay premios por mérito
          </p>
          <p>
            {support
              ? "Cuando el equipo cree uno, aparece acá."
              : "Creá uno antes del evento: cuenta desde la próxima medalla de cada visitante."}
          </p>
        </div>
      ) : (
        awards.map((a) => (
          <Award
            key={a.id}
            award={a}
            org={org.slug}
            timezone={timezone}
            totalSpots={totalSpots}
            winners={winners.filter((w) => w.awardId === a.id)}
            readOnly={support}
          />
        ))
      )}

      {!support && (
        <div className="grid max-w-prose gap-4">
          <h3 className="text-px-2">Nuevo premio por mérito</h3>
          <NewAwardForm org={org} eventId={eventId} />
        </div>
      )}
    </section>
  );
}

function Award({
  award,
  org,
  timezone,
  totalSpots,
  winners,
  readOnly,
}: {
  award: EventAward;
  org: string;
  timezone: string;
  totalSpots: number;
  winners: readonly AwardWinner[];
  readOnly: boolean;
}) {
  const unreachable = awardNeeded(award, totalSpots) > totalSpots;
  return (
    <article
      aria-labelledby={`premio-${award.id}`}
      className="grid gap-4 border-2 border-lcd-3 p-4 sm:p-6"
    >
      <div className="grid gap-1">
        <h3 id={`premio-${award.id}`} className="text-px-2 sm:text-px-3">
          {award.title}
        </h3>
        <p>
          Hacen falta {rule(award, totalSpots)}
          {" · "}
          {award.slots === null
            ? `${award.taken.toLocaleString("es-AR")} ${award.taken === 1 ? "ganó" : "ganaron"}, sin cupo`
            : `ganaron ${award.taken.toLocaleString("es-AR")} de ${award.slots.toLocaleString("es-AR")}`}
        </p>
        {unreachable && (
          <p className="font-display text-px-1 text-danger">
            Pide más medallas que stands activos: los visitantes no ven este
            premio y nadie puede ganarlo.
          </p>
        )}
      </div>

      {winners.length > 0 ? (
        <ol aria-label={`Ganadores de ${award.title}`} className="grid gap-2">
          {winners.map((w) => (
            <li
              key={`${w.awardId}-${w.position}`}
              className="grid grid-cols-[auto_1fr] items-baseline gap-3"
            >
              <span className="font-display text-px-2 tabular-nums">
                #{w.position}
              </span>
              <span className="grid">
                <span>{w.name}</span>
                <span className="text-sm break-all">
                  {w.email && w.email !== w.name ? `${w.email} · ` : ""}
                  {formatMoment(w.wonAt, timezone)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm">Todavía no lo ganó nadie.</p>
      )}

      {!readOnly && (
        <div className="flex flex-wrap items-start gap-3">
          <details className="grid gap-3">
            <summary
              aria-label={`Editar ${award.title}`}
              className={buttonClass(
                "secondary",
                "w-fit cursor-pointer list-none",
              )}
            >
              Editar
            </summary>
            <div className="mt-3 max-w-prose">
              <EditAwardForm
                org={org}
                awardId={award.id}
                title={award.title}
                description={award.description}
              />
            </div>
          </details>
          {award.taken === 0 && (
            <ActionButton
              action={deleteAwardAction}
              fields={{ org, awardId: award.id }}
              label="Quitar"
              ariaLabel={`Quitar ${award.title}`}
              pendingLabel="Quitando…"
              confirm={{
                message: `«${award.title}» deja de verse. Si querés otra regla, creá un premio nuevo.`,
                label: "Sí, quitar",
              }}
            />
          )}
        </div>
      )}
    </article>
  );
}

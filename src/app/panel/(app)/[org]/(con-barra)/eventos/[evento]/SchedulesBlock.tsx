import { DraftSteps } from "@/components/panel/DraftChecklist";
import { EditSheet } from "@/components/panel/EditSheet";
import { PublishButton } from "@/components/panel/PublishEvent";
import { ActionButton } from "@/components/ui/ActionButton";
import { formatEventDates, formatScheduleTimes } from "@/domain/events";
import { deleteScheduleAction } from "@/lib/actions/events";
import type { load } from "./load";
import { AddScheduleForm, EditScheduleForm } from "./ScheduleForms";

type Loaded = Awaited<ReturnType<typeof load>>;

/**
 * A draft's way to publishing: what it still lacks and the button once it
 * has a schedule. Only the team sees drafts.
 */
export function Publication({
  org,
  event,
  hasSpots,
}: {
  org: string;
  event: Loaded["event"];
  hasSpots: boolean;
}) {
  return (
    <section aria-labelledby="publicar" className="grid gap-3">
      <h2 id="publicar" className="text-px-2">
        Publicación
      </h2>
      <p className="max-w-prose">
        Es un borrador: solo lo ve tu equipo. Al publicarlo aparece en el
        dominio de la organización.
      </p>
      <DraftSteps
        draft={{
          hasSchedules: event.schedules.length > 0,
          hasSpots,
          hasVenue: event.venue !== null,
        }}
      />
      {/* Publishing needs a schedule; until then the steps above say so. */}
      {event.schedules.length > 0 && (
        <div>
          <PublishButton
            org={org}
            event={{ id: event.id, title: event.title }}
          />
        </div>
      )}
    </section>
  );
}

/**
 * The event's days, each with its hours: from them comes whether it is
 * upcoming, running or over. Edited in their own sheet.
 */
export function Schedules({
  org,
  event,
  editable,
}: {
  org: string;
  event: Loaded["event"];
  editable: boolean;
}) {
  const label = (s: { label: string | null }, i: number) =>
    s.label ?? `Jornada ${i + 1}`;
  const when = (s: (typeof event.schedules)[number]) =>
    `${formatEventDates([s], event.timezone)} · ${formatScheduleTimes(s, event.timezone)}`;

  const schedulesSheet = editable && (
    <EditSheet
      label={
        event.schedules.length === 0 ? "Agregar jornadas" : "Editar jornadas"
      }
      title="Jornadas"
      description={`Cada jornada es un día del evento, con su horario, en ${event.timezone.replaceAll("_", " ")}.`}
      variant={event.schedules.length === 0 ? "primary" : "secondary"}
    >
      {event.schedules.length > 0 && (
        <ol className="grid gap-2">
          {event.schedules.map((s, i) => (
            <li key={s.id} className="border-2 border-lcd-3">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-lcd-1 [&::-webkit-details-marker]:hidden">
                  <span className="grid gap-1">
                    <span className="font-display text-px-2">
                      {label(s, i)}
                    </span>
                    <span className="text-sm">{when(s)}</span>
                  </span>
                  <span className="shrink-0 font-display text-px-1 group-open:hidden">
                    Editar
                  </span>
                </summary>
                <div className="grid gap-6 border-t-2 border-lcd-3 px-4 py-5">
                  <EditScheduleForm
                    org={org}
                    eventId={event.id}
                    timezone={event.timezone}
                    schedule={s}
                  />
                  <ActionButton
                    action={deleteScheduleAction}
                    fields={{ org, id: s.id }}
                    label="Quitar jornada"
                    pendingLabel="Quitando…"
                    ariaLabel={`Quitar ${label(s, i)}`}
                  />
                </div>
              </details>
            </li>
          ))}
        </ol>
      )}
      <section aria-labelledby="nueva-jornada" className="panel grid gap-6 p-6">
        <h3 id="nueva-jornada" className="text-px-2">
          Nueva jornada
        </h3>
        <AddScheduleForm
          org={org}
          eventId={event.id}
          timezone={event.timezone}
        />
      </section>
    </EditSheet>
  );

  return (
    <section aria-labelledby="jornadas" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="jornadas" className="text-px-2">
          Jornadas
        </h2>
        {schedulesSheet}
      </div>
      {event.schedules.length === 0 ? (
        <div className="grid gap-2 border-2 border-dashed border-lcd-2 px-6 py-8 *:max-w-prose">
          <p className="font-display text-px-2">Todavía no hay jornadas</p>
          <p>
            Cada jornada es un día del evento, con su horario. De ellas sale si
            el evento es próximo, está en curso o terminó.
          </p>
        </div>
      ) : (
        <ol className="grid gap-2">
          {event.schedules.map((s, i) => (
            <li
              key={s.id}
              className="grid gap-1 border-2 border-lcd-3 px-4 py-3"
            >
              <p className="font-display text-px-2">{label(s, i)}</p>
              <p className="text-sm">{when(s)}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

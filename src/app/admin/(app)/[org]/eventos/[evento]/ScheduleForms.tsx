"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import {
  addScheduleAction,
  publishEventAction,
  setEventVenueAction,
} from "@/lib/actions/events";

type Ids = { org: string; eventId: string };

/** Adds a schedule. Times are typed in the event's zone. */
export function AddScheduleForm({
  org,
  eventId,
  timezone,
}: Ids & { timezone: string }) {
  const [state, action, pending] = useActionState(addScheduleAction, null);
  const { form, failed, fields, values } = useFormFeedback(
    state,
    "Jornada agregada.",
  );

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="eventId" value={eventId} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Nombre"
        name="label"
        defaultValue={values.label}
        placeholder="Día 1"
        hint="Opcional."
        error={fields.label}
      />
      <DateField
        label="Empieza"
        name="startsAt"
        time
        defaultValue={values.startsAt}
        error={fields.startsAt}
      />
      <DateField
        label="Termina"
        name="endsAt"
        time
        defaultValue={values.endsAt}
        error={fields.endsAt}
      />
      <p className="text-sm text-muted-foreground">
        Horario de {timezone.replaceAll("_", " ")}.
      </p>
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Agregando…"
        className="justify-self-start"
      >
        Agregar jornada
      </Button>
    </form>
  );
}

/**
 * Publishes a draft. Stays enabled (and focusable) without schedules: the hint
 * says why, and trying explains it again.
 */
export function PublishButton({
  org,
  eventId,
  ready,
}: Ids & { ready: boolean }) {
  const [state, action, pending] = useActionState(publishEventAction, null);
  return (
    <form action={action} className="grid justify-items-start gap-2">
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="eventId" value={eventId} />
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Publicando…"
        aria-describedby={ready ? undefined : "publicar-ayuda"}
      >
        Publicar
      </Button>
      {!ready && (
        <p id="publicar-ayuda" className="text-sm text-muted-foreground">
          Agregá al menos una jornada para publicar.
        </p>
      )}
      {state && !state.ok && (
        <FormMessage tone="error">{state.error}</FormMessage>
      )}
    </form>
  );
}

/** Sets, changes or clears the event's venue. */
export function VenueForm({
  org,
  eventId,
  venueId,
  venues,
  hasSchedules,
}: Ids & {
  venueId: string | null;
  venues: { id: string; name: string }[];
  hasSchedules: boolean;
}) {
  const [state, action, pending] = useActionState(setEventVenueAction, null);
  const { form, failed, fields, values } = useFormFeedback(
    state,
    "Sede guardada.",
  );

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="eventId" value={eventId} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <SelectField
        label="Sede"
        name="venueId"
        defaultValue={values.venueId ?? venueId ?? ""}
        hint={
          hasSchedules
            ? "Los horarios se muestran en la zona horaria de la sede: si es otra, las jornadas ya cargadas se ven con la hora de esa zona."
            : "Los horarios del evento se muestran en la zona horaria de la sede."
        }
        error={fields.venueId}
      >
        <option value="">Sin sede</option>
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </SelectField>
      <Button
        type="submit"
        variant="secondary"
        pending={pending}
        pendingLabel="Guardando…"
        className="justify-self-start"
      >
        Guardar sede
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Field, FormMessage } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { addScheduleAction, publishEventAction } from "@/lib/actions/events";

type Ids = { org: string; eventId: string };

/** Adds a schedule. Times are typed in the event's zone. */
export function AddScheduleForm({
  org,
  eventId,
  timezone,
}: Ids & { timezone: string }) {
  const [state, action, pending] = useActionState(addScheduleAction, null);
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="eventId" value={eventId} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      {state?.ok && <FormMessage tone="success">Jornada agregada.</FormMessage>}
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

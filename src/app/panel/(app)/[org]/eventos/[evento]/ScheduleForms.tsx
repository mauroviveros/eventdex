"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { instantToLocal } from "@/domain/events";
import {
  addScheduleAction,
  setEventVenueAction,
  updateEventAction,
  updateScheduleAction,
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

/** The event's own data. Its address is set when it's created and stays. */
export function EventDataForm({
  org,
  event,
}: {
  org: string;
  event: {
    id: string;
    title: string;
    editionLabel: string | null;
    summary: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateEventAction, null);
  const { form, failed, fields, values } = useFormFeedback(
    state,
    "Cambios guardados.",
  );

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="eventId" value={event.id} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Nombre"
        name="title"
        defaultValue={values.title ?? event.title}
        required
        error={fields.title}
      />
      <Field
        label="Edición"
        name="editionLabel"
        defaultValue={values.editionLabel ?? event.editionLabel ?? ""}
        placeholder="Noviembre 2026"
        hint="Opcional. Distingue esta edición de las anteriores."
        error={fields.editionLabel}
      />
      <Field
        label="Resumen"
        name="summary"
        defaultValue={values.summary ?? event.summary ?? ""}
        hint="Opcional. Una línea que aparece al compartir el link."
        error={fields.summary}
      />
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Guardando…"
        className="justify-self-start"
      >
        Guardar cambios
      </Button>
    </form>
  );
}

/** Corrects a schedule's name and times, typed in the event's zone. */
export function EditScheduleForm({
  org,
  eventId,
  timezone,
  schedule,
}: Ids & {
  timezone: string;
  schedule: {
    id: string;
    label: string | null;
    starts_at: string;
    ends_at: string;
  };
}) {
  const [state, action, pending] = useActionState(updateScheduleAction, null);
  const { form, failed, fields, values } = useFormFeedback(
    state,
    "Jornada guardada.",
  );

  return (
    <form ref={form} action={action} className="grid gap-5" noValidate>
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="id" value={schedule.id} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Nombre"
        name="label"
        defaultValue={values.label ?? schedule.label ?? ""}
        placeholder="Día 1"
        hint="Opcional."
        error={fields.label}
      />
      <DateField
        label="Empieza"
        name="startsAt"
        time
        defaultValue={
          values.startsAt ?? instantToLocal(schedule.starts_at, timezone)
        }
        error={fields.startsAt}
      />
      <DateField
        label="Termina"
        name="endsAt"
        time
        defaultValue={
          values.endsAt ?? instantToLocal(schedule.ends_at, timezone)
        }
        error={fields.endsAt}
      />
      <Button
        type="submit"
        variant="secondary"
        pending={pending}
        pendingLabel="Guardando…"
        className="justify-self-start"
      >
        Guardar jornada
      </Button>
    </form>
  );
}

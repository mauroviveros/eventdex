"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { createEventAction, duplicateEventAction } from "@/lib/actions/events";

type Props = {
  org: { id: string; slug: string; timezone: string };
  venues: { id: string; name: string; timezone: string }[];
  /** The org's latest event title, or its name: most editions repeat it. */
  defaultTitle: string;
  /** The event being duplicated: the form starts from its data. */
  source?: {
    id: string;
    title: string;
    summary: string | null;
    venueId: string | null;
  };
};

export function NewEventForm({ org, venues, defaultTitle, source }: Props) {
  const [state, action, pending] = useActionState(
    source ? duplicateEventAction : createEventAction,
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);
  const [venueId, setVenueId] = useState(
    values.venueId ?? source?.venueId ?? "",
  );

  // The event shows its times in its venue's zone; without a venue, the org's.
  const timezone =
    venues.find((v) => v.id === venueId)?.timezone ?? org.timezone;

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org.slug} />
      <input type="hidden" name="organizationId" value={org.id} />
      <input type="hidden" name="timezone" value={timezone} />
      {source && <input type="hidden" name="sourceId" value={source.id} />}
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Nombre"
        name="title"
        defaultValue={values.title ?? source?.title ?? defaultTitle}
        required
        placeholder="Expo de Ejemplo 2026"
        error={fields.title}
      />
      <Field
        label="Edición"
        name="editionLabel"
        defaultValue={values.editionLabel}
        placeholder="2026"
        hint="Opcional. Distingue esta edición de las anteriores."
        error={fields.editionLabel}
      />
      <SelectField
        label="Sede"
        name="venueId"
        value={venueId}
        onChange={(e) => setVenueId(e.target.value)}
        hint={
          venues.length === 0
            ? "Todavía no cargaste sedes. Podés crear el evento y elegirla después."
            : `Los horarios se muestran en ${timezone.replaceAll("_", " ")}.`
        }
        error={fields.venueId}
      >
        <option value="">Sin sede por ahora</option>
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </SelectField>
      <Field
        label="Resumen"
        name="summary"
        defaultValue={values.summary ?? source?.summary ?? undefined}
        hint="Opcional. Una línea que aparece al compartir el link."
        error={fields.summary}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" pending={pending} pendingLabel="Creando…">
          {source ? "Duplicar evento" : "Crear evento"}
        </Button>
        <Link href={`/panel/${org.slug}`} className="font-display text-px-1">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

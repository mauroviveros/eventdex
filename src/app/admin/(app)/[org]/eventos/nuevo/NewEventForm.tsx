"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { createEventAction } from "@/lib/actions/events";

type Props = {
  org: { id: string; slug: string; timezone: string };
  venues: { id: string; name: string; timezone: string }[];
};

export function NewEventForm({ org, venues }: Props) {
  const [state, action, pending] = useActionState(createEventAction, null);
  const failed = state && !state.ok ? state : null;
  const fields = failed?.fieldErrors ?? {};
  const values = failed?.values ?? {};
  const [venueId, setVenueId] = useState(values.venueId ?? "");
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.ok)
      form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [state]);

  // The event shows its times in its venue's zone; without a venue, the org's.
  const timezone =
    venues.find((v) => v.id === venueId)?.timezone ?? org.timezone;

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org.slug} />
      <input type="hidden" name="organizationId" value={org.id} />
      <input type="hidden" name="timezone" value={timezone} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Nombre"
        name="title"
        defaultValue={values.title}
        required
        placeholder="Expo de Ejemplo 2026"
        error={fields.title}
      />
      <Field
        label="Dirección en el panel"
        name="slug"
        defaultValue={values.slug}
        required
        placeholder="expo-2026"
        hint={`Queda en /${org.slug}/eventos/… y en el link público. Minúsculas, números y guiones.`}
        error={fields.slug}
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
        defaultValue={values.summary}
        hint="Opcional. Una línea que aparece al compartir el link."
        error={fields.summary}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" pending={pending} pendingLabel="Creando…">
          Crear evento
        </Button>
        <Link href={`/${org.slug}`} className="font-display text-px-1">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { createVenueAction } from "@/lib/actions/events";

type Props = {
  org: { id: string; slug: string; timezone: string };
  timezones: string[];
};

export function NewVenueForm({ org, timezones }: Props) {
  const [state, action, pending] = useActionState(createVenueAction, null);
  const { form, failed, fields, values } = useFormFeedback(
    state,
    "Sede creada.",
  );

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org.slug} />
      <input type="hidden" name="organizationId" value={org.id} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Nombre"
        name="name"
        defaultValue={values.name}
        required
        placeholder="Predio Norte"
        error={fields.name}
      />
      <Field
        label="Dirección"
        name="addressLine"
        defaultValue={values.addressLine}
        autoComplete="street-address"
        error={fields.addressLine}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Ciudad"
          name="city"
          defaultValue={values.city}
          autoComplete="address-level2"
          error={fields.city}
        />
        <Field
          label="Provincia"
          name="state"
          defaultValue={values.state}
          autoComplete="address-level1"
          error={fields.state}
        />
      </div>
      <Field
        label="Código postal"
        name="postalCode"
        defaultValue={values.postalCode}
        autoComplete="postal-code"
        className="sm:max-w-48"
        error={fields.postalCode}
      />
      <SelectField
        label="Zona horaria"
        name="timezone"
        defaultValue={values.timezone ?? org.timezone}
        hint="Los eventos de esta sede muestran sus horarios en esta zona."
        error={fields.timezone}
      >
        {timezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz.replaceAll("_", " ")}
          </option>
        ))}
      </SelectField>
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Guardando…"
        className="justify-self-start"
      >
        Crear sede
      </Button>
    </form>
  );
}

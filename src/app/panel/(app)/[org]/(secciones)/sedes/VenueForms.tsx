"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { createVenueAction, updateVenueAction } from "@/lib/actions/events";
import type { FormState } from "@/lib/actions/form";

type Props = {
  org: { id: string; slug: string; timezone: string };
  timezones: string[];
};

/** A new venue: name, address and the time zone its events take. */
export function NewVenueForm({ org, timezones }: Props) {
  // The toast goes out with the response: the first venue swaps the page to
  // the list, and this form unmounts before an effect could announce it.
  const [state, action, pending] = useActionState(
    async (prev: FormState, data: FormData) => {
      const next = await createVenueAction(prev, data);
      if (next?.ok) toast.success("Sede creada.");
      return next;
    },
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

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

type Venue = {
  id: string;
  name: string;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  timezone: string;
};

/** Name and address of a venue. The zone is shown, not edited: its events already took it. */
export function EditVenueForm({ org, venue }: { org: string; venue: Venue }) {
  const [state, action, pending] = useActionState(updateVenueAction, null);
  const { form, failed, fields, values } = useFormFeedback(
    state,
    "Sede guardada.",
  );
  const value = (name: string, saved: string | null) =>
    values[name] ?? saved ?? "";

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="venueId" value={venue.id} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Nombre"
        name="name"
        defaultValue={value("name", venue.name)}
        required
        error={fields.name}
      />
      <Field
        label="Dirección"
        name="addressLine"
        defaultValue={value("addressLine", venue.address_line)}
        autoComplete="street-address"
        error={fields.addressLine}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Ciudad"
          name="city"
          defaultValue={value("city", venue.city)}
          autoComplete="address-level2"
          error={fields.city}
        />
        <Field
          label="Provincia"
          name="state"
          defaultValue={value("state", venue.state)}
          autoComplete="address-level1"
          error={fields.state}
        />
      </div>
      <Field
        label="Código postal"
        name="postalCode"
        defaultValue={value("postalCode", venue.postal_code)}
        autoComplete="postal-code"
        className="sm:max-w-48"
        error={fields.postalCode}
      />
      <p className="text-sm text-muted-foreground">
        Zona horaria: {venue.timezone.replaceAll("_", " ")}. No cambia: cada
        evento de esta sede ya tomó la suya.
      </p>
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Guardando…"
        className="justify-self-start"
      >
        Guardar sede
      </Button>
    </form>
  );
}

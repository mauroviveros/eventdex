"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { SPOT_TYPE_LABEL, SPOT_TYPES, type SpotType } from "@/domain/spots";
import type { FormState } from "@/lib/actions/form";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  org: string;
  /** Hidden ids the action needs (organizationId to create, id to edit). */
  ids: Record<string, string>;
  spot?: { name: string; description: string | null; type: SpotType };
  submitLabel: string;
  pendingLabel: string;
  savedMessage?: string;
};

/** A catalog spot's name, type and description: the same form to create and to edit. */
export function SpotForm({
  action: run,
  org,
  ids,
  spot,
  submitLabel,
  pendingLabel,
  savedMessage,
}: Props) {
  const [state, action, pending] = useActionState(run, null);
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org} />
      {Object.entries(ids).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      {state?.ok && savedMessage && (
        <FormMessage tone="success">{savedMessage}</FormMessage>
      )}
      <Field
        label="Nombre"
        name="name"
        defaultValue={values.name ?? spot?.name}
        required
        placeholder="Café de la Esquina"
        error={fields.name}
      />
      <SelectField
        label="Tipo"
        name="type"
        defaultValue={values.type ?? spot?.type ?? "stand"}
        hint="Define el dibujo de la medalla."
        error={fields.type}
      >
        {SPOT_TYPES.map((t) => (
          <option key={t} value={t}>
            {SPOT_TYPE_LABEL[t]}
          </option>
        ))}
      </SelectField>
      <Field
        label="Descripción"
        name="description"
        defaultValue={values.description ?? spot?.description ?? ""}
        hint="Opcional. Una línea sobre qué hay en el spot."
        error={fields.description}
      />
      <Button
        type="submit"
        pending={pending}
        pendingLabel={pendingLabel}
        className="justify-self-start"
      >
        {submitLabel}
      </Button>
    </form>
  );
}

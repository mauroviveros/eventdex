"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Field,
  FormMessage,
  SelectField,
  TextareaField,
} from "@/components/ui/Field";
import { announce, useFormFeedback } from "@/components/ui/useFormFeedback";
import { createAwardAction, updateAwardAction } from "@/lib/actions/awards";

type NewProps = { org: { id: string; slug: string }; eventId: string };

/** A merit award: won by what the visitor did, not by chance. */
export function NewAwardForm({ org, eventId }: NewProps) {
  const [state, action, pending] = useActionState(
    announce(createAwardAction, "Premio creado."),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org.slug} />
      <input type="hidden" name="organizationId" value={org.id} />
      <input type="hidden" name="eventId" value={eventId} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Nombre"
        name="title"
        defaultValue={values.title}
        required
        placeholder="Primeros 5 en completar todas"
        error={fields.title}
      />
      <SelectField
        label="Cómo se gana"
        name="kind"
        defaultValue={values.kind ?? "percent"}
        error={fields.kind}
      >
        <option value="percent">Juntando un porcentaje de las medallas</option>
        <option value="count">Juntando una cantidad de medallas</option>
      </SelectField>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Porcentaje o cantidad"
          name="threshold"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={values.threshold ?? "100"}
          required
          hint="Con porcentaje: 100 son todas, 50 la mitad. Con cantidad: cuántas medallas."
          error={fields.threshold}
        />
        <Field
          label="Cupo (opcional)"
          name="slots"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={values.slots}
          hint="Los primeros N en llegar. Vacío: lo gana todo el que llegue."
          error={fields.slots}
        />
      </div>
      <TextareaField
        label="Descripción (opcional)"
        name="description"
        maxLength={500}
        className="[&_textarea]:min-h-20"
        defaultValue={values.description}
        error={fields.description}
      />
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        pendingLabel="Creando…"
        className="justify-self-start"
      >
        Crear premio
      </Button>
    </form>
  );
}

type EditProps = {
  org: string;
  awardId: string;
  title: string;
  description: string | null;
};

/** The name and the description. The rule stays: it already may have winners. */
export function EditAwardForm({ org, awardId, title, description }: EditProps) {
  const [state, action, pending] = useActionState(
    announce(updateAwardAction, "Premio actualizado."),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="awardId" value={awardId} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Nombre"
        name="title"
        defaultValue={values.title ?? title}
        required
        error={fields.title}
      />
      <TextareaField
        label="Descripción"
        name="description"
        maxLength={500}
        className="[&_textarea]:min-h-20"
        defaultValue={values.description ?? description ?? ""}
        error={fields.description}
      />
      <Button
        type="submit"
        variant="secondary"
        pending={pending}
        pendingLabel="Guardando…"
        className="justify-self-start"
      >
        Guardar
      </Button>
    </form>
  );
}

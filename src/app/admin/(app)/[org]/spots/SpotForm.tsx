"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { LogoField } from "@/components/ui/LogoField";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Label } from "@/components/ui/shadcn/label";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { SPOT_TYPE_LABEL, SPOT_TYPES, type SpotType } from "@/domain/spots";
import type { FormState } from "@/lib/actions/form";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  org: string;
  /** Hidden ids the action needs (organizationId to create, id to edit). */
  ids: Record<string, string>;
  spot?: { name: string; description: string | null; type: SpotType };
  /** The spot's current logo, to edit. */
  logo?: string;
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
  logo,
  submitLabel,
  pendingLabel,
  savedMessage,
}: Props) {
  const [state, action, pending] = useActionState(run, null);
  const { form, failed, fields, values } = useFormFeedback(state, savedMessage);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org} />
      {Object.entries(ids).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
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
      <LogoField
        hint="Opcional. PNG, JPG o WebP, hasta 1 MB. Sin logo, la medalla usa el dibujo del tipo."
        error={fields.logo}
      />
      {logo && (
        <div className="flex flex-wrap items-center gap-4">
          {/* biome-ignore lint/performance/noImgElement: a logo from Storage, shown as uploaded */}
          <img
            src={logo}
            alt="Logo actual"
            className="size-16 border-2 border-lcd-3 object-contain"
          />
          <Label className="min-h-11 font-sans text-base">
            <Checkbox name="removeLogo" />
            <span>Quitar el logo</span>
          </Label>
        </div>
      )}
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

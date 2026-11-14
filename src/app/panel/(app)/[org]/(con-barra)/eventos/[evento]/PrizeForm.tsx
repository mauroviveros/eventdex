"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage } from "@/components/ui/Field";
import { LogoField } from "@/components/ui/LogoField";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Label } from "@/components/ui/shadcn/label";
import { announce, useFormFeedback } from "@/components/ui/useFormFeedback";
import { COVER_MAX_BYTES } from "@/domain/events";
import { updateRafflePrizeAction } from "@/lib/actions/raffles";

type Props = {
  org: { slug: string; id: string };
  raffleId: string;
  description: string | null;
  /** The prize's current picture, to replace or remove. */
  image?: string;
};

/** What the visitor reads of a prize on the event's page: a line about it and a picture. */
export function PrizeForm({ org, raffleId, description, image }: Props) {
  const [state, action, pending] = useActionState(
    announce(updateRafflePrizeAction, "Premio actualizado."),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org.slug} />
      <input type="hidden" name="organizationId" value={org.id} />
      <input type="hidden" name="raffleId" value={raffleId} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Descripción"
        name="description"
        defaultValue={values.description ?? description ?? ""}
        maxLength={500}
        hint="Opcional. Qué se lleva quien gana; se muestra en la portada."
        error={fields.description}
      />
      <LogoField
        label="Imagen"
        maxBytes={COVER_MAX_BYTES}
        hint="Opcional. PNG, JPG o WebP, hasta 1,5 MB. Sin imagen, el premio se muestra con una copa."
        error={fields.image}
      />
      {image && (
        <div className="flex flex-wrap items-center gap-4">
          {/* biome-ignore lint/performance/noImgElement: a prize image from Storage, shown as uploaded */}
          <img
            src={image}
            alt="Imagen actual del premio"
            className="size-16 border-2 border-lcd-3 object-cover"
          />
          <Label className="min-h-11 font-sans text-base">
            <Checkbox name="removeImage" />
            <span>Quitar la imagen</span>
          </Label>
        </div>
      )}
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

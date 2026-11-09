"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";
import { LogoField } from "@/components/ui/LogoField";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { COVER_MAX_BYTES } from "@/domain/events";
import { removeCoverAction, uploadCoverAction } from "@/lib/actions/events";

type Ids = { org: string; organizationId: string; eventId: string };

/** Uploads, replaces or removes the event's banner. */
export function CoverForm({ ids, hasCover }: { ids: Ids; hasCover: boolean }) {
  const [state, action, pending] = useActionState(uploadCoverAction, null);
  const { form, failed, fields } = useFormFeedback(state);

  return (
    <div className="grid gap-4">
      <form ref={form} action={action} className="grid gap-6" noValidate>
        <input type="hidden" name="org" value={ids.org} />
        <input type="hidden" name="organizationId" value={ids.organizationId} />
        <input type="hidden" name="eventId" value={ids.eventId} />
        {failed && !failed.fieldErrors && (
          <FormMessage tone="error">{failed.error}</FormMessage>
        )}
        {state?.ok && (
          <FormMessage tone="success">Banner actualizado.</FormMessage>
        )}
        <LogoField
          label="Banner"
          maxBytes={COVER_MAX_BYTES}
          hint="PNG, JPG o WebP, hasta 1,5 MB. Se muestra tal cual lo subas, arriba de todo en la portada."
          error={fields.cover}
        />
        <Button
          type="submit"
          variant="secondary"
          pending={pending}
          pendingLabel="Subiendo…"
          className="justify-self-start"
        >
          Subir banner
        </Button>
      </form>
      {hasCover && (
        <ActionButton
          action={removeCoverAction}
          fields={ids}
          label="Quitar banner"
          pendingLabel="Quitando…"
          confirm={{
            message: "El banner se borra y la portada queda sin imagen.",
            label: "Sí, quitar",
          }}
        />
      )}
    </div>
  );
}

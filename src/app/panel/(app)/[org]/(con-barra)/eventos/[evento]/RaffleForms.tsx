"use client";

import { useActionState } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field, FormMessage } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import {
  createRaffleAction,
  voidRaffleDrawAction,
} from "@/lib/actions/raffles";

type NewRaffleProps = { org: { id: string; slug: string }; eventId: string };

export function NewRaffleForm({ org, eventId }: NewRaffleProps) {
  const [state, action, pending] = useActionState(createRaffleAction, null);
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
        label="Premio"
        name="title"
        defaultValue={values.title}
        required
        placeholder="Bicicleta"
        error={fields.title}
      />
      <Field
        label="Medallas para participar"
        name="minClaims"
        type="number"
        inputMode="numeric"
        min={1}
        defaultValue={values.minClaims ?? "1"}
        required
        className="sm:max-w-48"
        hint="Con una alcanza para entrar. Subilo si querés premiar a quien recorrió más."
        error={fields.minClaims}
      />
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        pendingLabel="Creando…"
        className="justify-self-start"
      >
        Crear sorteo
      </Button>
    </form>
  );
}

type VoidProps = { org: string; drawId: string; name: string };

/** Voiding needs a reason, so it opens in place instead of asking to confirm. */
export function VoidDrawForm({ org, drawId, name }: VoidProps) {
  const [state, action, pending] = useActionState(voidRaffleDrawAction, null);
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <details className="grid gap-3">
      <summary
        aria-label={`Anular la extracción de ${name}`}
        className={buttonClass("secondary", "w-fit cursor-pointer list-none")}
      >
        Anular
      </summary>
      <form
        ref={form}
        action={action}
        className="mt-3 grid gap-3 border-2 border-danger p-3"
        noValidate
      >
        <input type="hidden" name="org" value={org} />
        <input type="hidden" name="drawId" value={drawId} />
        {failed && !failed.fieldErrors && (
          <FormMessage tone="error">{failed.error}</FormMessage>
        )}
        <Field
          label="Motivo"
          name="reason"
          defaultValue={values.reason}
          required
          placeholder="No se presentó"
          hint="Queda registrado. La extracción no se borra y esa persona no vuelve a entrar en este sorteo."
          error={fields.reason}
        />
        <Button
          type="submit"
          variant="danger"
          pending={pending}
          pendingLabel="Anulando…"
          className="justify-self-start"
        >
          Anular extracción
        </Button>
      </form>
    </details>
  );
}

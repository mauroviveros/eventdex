"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import {
  assignDomainAction,
  type DomainFormState,
} from "@/lib/actions/platform";

/** Adds a domain. If another org has it, says which and asks before moving it. */
export function DomainForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(assignDomainAction, null);
  const { form, failed, fields, values } = useFormFeedback(state);
  const [cancelled, setCancelled] = useState<DomainFormState>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const consequence = useId();
  const taken =
    state && !state.ok && "conflict" in state ? state.conflict : null;
  const conflict = state === cancelled ? null : taken;

  // Take the focus to the decision, so a keyboard user lands on it.
  useEffect(() => {
    if (conflict) confirmRef.current?.focus();
  }, [conflict]);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="organizationId" value={organizationId} />
      {failed && !failed.fieldErrors && !taken && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      {state?.ok && <FormMessage tone="success">Dominio sumado.</FormMessage>}
      <Field
        label="Dominio"
        name="hostname"
        defaultValue={values.hostname}
        readOnly={conflict !== null}
        autoComplete="off"
        placeholder="expo.com.ar"
        required
        hint="Cargalo antes en Vercel y en las Redirect URLs de Auth: si no, no abre."
        error={fields.hostname}
      />
      {conflict ? (
        <div className="grid gap-3 border-2 border-danger p-3">
          <input type="hidden" name="transfer" value="on" />
          {values.makePrimary === "on" && (
            <input type="hidden" name="makePrimary" value="on" />
          )}
          <p id={consequence}>
            {values.hostname} ya es de {conflict}. Si lo movés, los QR impresos
            con ese dominio dejan de andar allá. Si era su principal, pasa a
            serlo otro de sus dominios.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              ref={confirmRef}
              aria-describedby={consequence}
              type="submit"
              variant="danger"
              pending={pending}
              pendingLabel="Moviendo…"
            >
              Sí, mover
            </Button>
            <Button onClick={() => setCancelled(state)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" pending={pending} pendingLabel="Sumando…">
            Sumar dominio
          </Button>
          <Button
            type="submit"
            variant="secondary"
            name="makePrimary"
            value="on"
            disabled={pending}
          >
            Sumar y hacer principal
          </Button>
        </div>
      )}
    </form>
  );
}

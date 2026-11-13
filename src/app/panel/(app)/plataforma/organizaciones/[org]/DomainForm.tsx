"use client";

import {
  type ReactNode,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage } from "@/components/ui/Field";
import { announce, useFormFeedback } from "@/components/ui/useFormFeedback";
import {
  assignDomainAction,
  type DomainFormState,
} from "@/lib/actions/platform";

/** The consequence and a second, explicit submit. Takes the focus when it opens. */
function Confirm({
  message,
  label,
  pendingLabel,
  pending,
  onCancel,
  children,
}: {
  message: string;
  label: string;
  pendingLabel: string;
  pending: boolean;
  onCancel: () => void;
  children: ReactNode;
}) {
  const consequence = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <div className="grid gap-3 border-2 border-danger p-3">
      {children}
      <p id={consequence}>{message}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          ref={confirmRef}
          aria-describedby={consequence}
          type="submit"
          variant="danger"
          pending={pending}
          pendingLabel={pendingLabel}
        >
          {label}
        </Button>
        <Button onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/** Adds a domain. Asks first if it becomes the primary or another org has it. */
export function DomainForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(
    announce(assignDomainAction, "Dominio sumado."),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);
  // Each holds the state it was decided on, so the next response closes it.
  const [cancelled, setCancelled] = useState<DomainFormState>(null);
  const [askedPrimary, setAskedPrimary] = useState<DomainFormState>();
  const taken =
    state && !state.ok && "conflict" in state ? state.conflict : null;
  const conflict = state === cancelled ? null : taken;
  const askingPrimary = askedPrimary === state;
  const confirming = conflict !== null || askingPrimary;

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="organizationId" value={organizationId} />
      {failed && !failed.fieldErrors && !taken && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Field
        label="Dominio"
        name="hostname"
        defaultValue={values.hostname}
        readOnly={confirming}
        // Enter would submit the first button of the form: the confirmation.
        onKeyDown={(e) => {
          if (confirming && e.key === "Enter") e.preventDefault();
        }}
        autoComplete="off"
        placeholder="expo.com.ar"
        required
        hint="Cargalo antes en Vercel y en las Redirect URLs de Auth: si no, no abre."
        error={fields.hostname}
      />
      {conflict ? (
        <Confirm
          key="move"
          message={`${values.hostname} ya es de ${conflict.owner_name}. Si lo movés, los QR impresos con ese dominio dejan de andar allá.${
            conflict.next_primary
              ? ` Su principal pasa a ser ${conflict.next_primary}: revisá que abra.`
              : ""
          }`}
          label="Sí, mover"
          pendingLabel="Moviendo…"
          pending={pending}
          onCancel={() => setCancelled(state)}
        >
          <input type="hidden" name="transferFrom" value={conflict.owner_id} />
          {values.makePrimary === "on" && (
            <input type="hidden" name="makePrimary" value="on" />
          )}
        </Confirm>
      ) : askingPrimary ? (
        <Confirm
          key="primary"
          message="Hacelo solo si este dominio ya abre los eventos de la organización: los QR que se impriman desde ahora van a apuntar ahí. Los ya impresos siguen andando mientras no se quite el dominio anterior."
          label="Sí, hacer principal"
          pendingLabel="Sumando…"
          pending={pending}
          onCancel={() => setAskedPrimary(undefined)}
        >
          <input type="hidden" name="makePrimary" value="on" />
        </Confirm>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" pending={pending} pendingLabel="Sumando…">
            Sumar dominio
          </Button>
          <Button
            variant="secondary"
            onClick={() => setAskedPrimary(state)}
            disabled={pending}
          >
            Sumar y hacer principal
          </Button>
        </div>
      )}
    </form>
  );
}

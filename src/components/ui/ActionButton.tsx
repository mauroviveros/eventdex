"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FormState } from "@/lib/actions/form";
import { Button, type Variant } from "./Button";
import { FormMessage } from "./Field";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Hidden fields the action reads (org, id…). */
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
  variant?: Variant;
  /** Accessible name when the visible label needs context ("Quitar Día 1"). */
  ariaLabel?: string;
  /**
   * Ask before acting, for what can't be undone. The first click shows the
   * consequence and a second, explicit button.
   */
  confirm?: { message: string; label: string };
};

/** One action, one button: hidden fields, pending state, and the error under it. */
export function ActionButton({
  action: run,
  fields,
  label,
  pendingLabel,
  variant = "secondary",
  ariaLabel,
  confirm,
}: Props) {
  const [state, action, pending] = useActionState(run, null);
  const [asking, setAsking] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Take the focus to the decision, so a keyboard user lands on it.
  useEffect(() => {
    if (asking) confirmRef.current?.focus();
  }, [asking]);

  return (
    <form action={action} className="grid justify-items-start gap-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {confirm && asking ? (
        <div className="grid gap-3 border-2 border-danger p-3">
          <p>{confirm.message}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              ref={confirmRef}
              type="submit"
              variant="danger"
              pending={pending}
              pendingLabel={pendingLabel}
            >
              {confirm.label}
            </Button>
            <Button onClick={() => setAsking(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type={confirm ? "button" : "submit"}
          onClick={confirm ? () => setAsking(true) : undefined}
          variant={variant}
          pending={pending}
          pendingLabel={pendingLabel}
          aria-label={ariaLabel}
        >
          {label}
        </Button>
      )}
      {state && !state.ok && (
        <FormMessage tone="error">{state.error}</FormMessage>
      )}
    </form>
  );
}

"use client";

import { useActionState, useRef, useState } from "react";
import type { FormState } from "@/lib/actions/form";
import { Button, type Variant } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
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
   * Ask before acting, for what can't be undone: a ConfirmDialog titled with
   * the action and its object, the consequence, and an explicit button.
   */
  confirm?: { message: string; label: string };
  /** Id of what takes the focus if confirming removes this button. */
  fallbackFocus?: string;
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
  fallbackFocus,
}: Props) {
  const [state, action, pending] = useActionState(run, null);
  const [asking, setAsking] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  if (confirm) {
    return (
      <>
        <Button
          ref={button}
          variant={variant}
          aria-label={ariaLabel}
          onClick={() => setAsking(true)}
        >
          {label}
        </Button>
        <ConfirmDialog
          open={asking}
          onOpenChange={setAsking}
          opener={button}
          fallbackFocus={fallbackFocus}
          title={ariaLabel ?? label}
          message={confirm.message}
          label={confirm.label}
          pendingLabel={pendingLabel}
          action={run}
          fields={fields}
        />
      </>
    );
  }

  return (
    <form action={action} className="grid justify-items-start gap-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button
        type="submit"
        variant={variant}
        pending={pending}
        pendingLabel={pendingLabel}
        aria-label={ariaLabel}
      >
        {label}
      </Button>
      {state && !state.ok && (
        <FormMessage tone="error">{state.error}</FormMessage>
      )}
    </form>
  );
}

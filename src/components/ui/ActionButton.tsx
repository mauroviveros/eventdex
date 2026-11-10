"use client";

import { useActionState, useEffect, useId, useState } from "react";
import type { FormState } from "@/lib/actions/form";
import { Button, type Variant } from "./Button";
import { FormMessage } from "./Field";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./shadcn/alert-dialog";

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
   * Ask before acting, for what can't be undone: a dialog titled with the
   * action and its object, the consequence, and an explicit button.
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
  const id = useId();

  // The dialog stays up while the action runs and closes when it's done; an
  // error then shows under the button, where the focus comes back.
  useEffect(() => {
    if (!pending) setAsking(false);
  }, [pending]);

  const button = (
    <Button
      type={confirm ? "button" : "submit"}
      variant={variant}
      pending={pending}
      pendingLabel={pendingLabel}
      aria-label={ariaLabel}
    >
      {label}
    </Button>
  );

  return (
    <form id={id} action={action} className="grid justify-items-start gap-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {confirm ? (
        <AlertDialog open={asking} onOpenChange={setAsking}>
          <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>{ariaLabel ?? label}</AlertDialogTitle>
            <AlertDialogDescription>{confirm.message}</AlertDialogDescription>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                form={id}
                variant="danger"
                pending={pending}
                pendingLabel={pendingLabel}
              >
                {confirm.label}
              </Button>
              <AlertDialogCancel asChild>
                <Button variant="secondary" disabled={pending}>
                  Cancelar
                </Button>
              </AlertDialogCancel>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        button
      )}
      {state && !state.ok && (
        <FormMessage tone="error">{state.error}</FormMessage>
      )}
    </form>
  );
}

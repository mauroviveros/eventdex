"use client";

import {
  type RefObject,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FormState } from "@/lib/actions/form";
import { Button } from "./Button";
import { FormMessage } from "./Field";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "./shadcn/alert-dialog";
import { announce } from "./useFormFeedback";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The action and its object: "Quitar a Martín". */
  title: string;
  /** The consequence, in a sentence. */
  message: string;
  /** The explicit button: "Sí, quitar". */
  label: string;
  pendingLabel: string;
  action: Action;
  /** Hidden fields the action reads (org, id…). */
  fields: Record<string, string>;
  /** The toast when it works. */
  done?: string;
  /** "danger" for what can't be undone; "primary" for a step forward (publish). */
  variant?: "danger" | "primary";
  /** What opened it, to get the focus back. */
  opener: RefObject<HTMLElement | null>;
  /**
   * Id of what takes the focus when the opener is gone (the row it removed).
   * Without one, the page's h1.
   */
  fallbackFocus?: string;
};

/**
 * The panel's one way to ask before acting: a dialog with the action and its
 * object, the consequence, an explicit button (focused on Cancelar first) and
 * the error inside if it fails. It runs the action itself, so the success
 * toast and the closing don't depend on what's left on the page.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  opener,
  fallbackFocus,
  ...ask
}: Props) {
  const [pending, setPending] = useState(false);
  return (
    <AlertDialog
      open={open}
      // Escape can't close it mid-action: it would look cancelled.
      onOpenChange={(next) => pending || onOpenChange(next)}
    >
      <AlertDialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          refocus(opener.current, fallbackFocus);
        }}
      >
        <AlertDialogTitle>{ask.title}</AlertDialogTitle>
        <AlertDialogDescription>{ask.message}</AlertDialogDescription>
        <ConfirmForm
          {...ask}
          onPending={setPending}
          onDone={() => onOpenChange(false)}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Back to what opened the dialog, or, if it's gone, to the fallback: a page
 * that lost a row keeps the keyboard where the user was, not at the top.
 */
function refocus(opener: HTMLElement | null, fallbackId?: string) {
  if (opener?.isConnected) return opener.focus();
  const target =
    (fallbackId && document.getElementById(fallbackId)) ||
    document.querySelector("main h1, h1");
  if (!(target instanceof HTMLElement)) return;
  // A heading takes the focus only through script.
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus();
}

/**
 * The dialog's form. It mounts each time the dialog opens, so an error from a
 * previous try doesn't greet the next one.
 */
function ConfirmForm({
  label,
  pendingLabel,
  action,
  fields,
  done,
  variant = "danger",
  onPending,
  onDone,
}: Omit<Props, "open" | "onOpenChange" | "opener" | "fallbackFocus"> & {
  /** Stable (a state setter): the effect below must not re-run on renders. */
  onPending: (pending: boolean) => void;
  onDone: () => void;
}) {
  const [state, run, pending] = useActionState(announce(action, done), null);
  useEffect(() => onPending(pending), [pending, onPending]);
  // onDone is a new function each render: read it through a ref, once per result.
  const done$ = useRef(onDone);
  done$.current = onDone;
  useEffect(() => {
    if (state?.ok) done$.current();
  }, [state]);

  return (
    <>
      {state && !state.ok && (
        <FormMessage tone="error">{state.error}</FormMessage>
      )}
      <form action={run} className="flex flex-wrap gap-2">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Button
          type="submit"
          variant={variant}
          pending={pending}
          pendingLabel={pendingLabel}
        >
          {label}
        </Button>
        <AlertDialogCancel asChild>
          <Button variant="secondary" disabled={pending}>
            Cancelar
          </Button>
        </AlertDialogCancel>
      </form>
    </>
  );
}

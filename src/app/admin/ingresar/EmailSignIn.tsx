"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { signInWithEmail } from "@/lib/actions/auth";

/** Development only: magic link to the local mail viewer. */
export function EmailSignIn({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInWithEmail, null);

  if (state?.sent) {
    return (
      <p role="status" className="border-t-2 border-dashed border-lcd-2 pt-5">
        Te mandamos un link a <strong>{state.sent}</strong>. En desarrollo llega
        al visor de mails local:{" "}
        <a href="http://127.0.0.1:54424" target="_blank" rel="noreferrer">
          127.0.0.1:54424
        </a>
        .
      </p>
    );
  }

  return (
    <form
      action={action}
      className="grid gap-4 border-t-2 border-dashed border-lcd-2 pt-5"
    >
      <p className="text-sm text-muted-foreground">
        Solo en desarrollo: ingresá con un link por mail.
      </p>
      <input type="hidden" name="next" value={next} />
      <Field
        label="Mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state?.error}
      />
      <Button
        type="submit"
        variant="secondary"
        pending={pending}
        pendingLabel="Mandando…"
      >
        Mandarme el link
      </Button>
    </form>
  );
}

"use client";

import { type ReactNode, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button, type Variant } from "@/components/ui/Button";
import { signInWithGoogle } from "@/lib/actions/auth";

type Props = {
  /** Where to come back to after signing in. */
  next: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

/** Starts Google sign-in from where the visitor is, with feedback on slow signal. */
export function GoogleSignIn({ next, ...button }: Props) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <Submit {...button} />
    </form>
  );
}

function Submit({ variant, className, children }: Omit<Props, "next">) {
  const { pending } = useFormStatus();

  // Back from Google can restore this page frozen mid-submit, button disabled.
  useEffect(() => {
    if (!pending) return;
    const restored = (e: PageTransitionEvent) => {
      if (e.persisted) location.reload();
    };
    addEventListener("pageshow", restored);
    return () => removeEventListener("pageshow", restored);
  }, [pending]);

  return (
    <Button
      type="submit"
      variant={variant}
      className={className}
      pending={pending}
      pendingLabel="Yendo a Google…"
    >
      {children}
    </Button>
  );
}

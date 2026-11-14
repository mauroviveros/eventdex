import type { ReactNode } from "react";
import { AlertIcon } from "@/components/pixel/AlertIcon";

/** Google or the mail link failed (`?error=auth`): said once, the same everywhere. */
export function SignInError({
  children = "No pudimos completar el ingreso. Probá de nuevo.",
}: {
  children?: ReactNode;
}) {
  return (
    <p role="alert" className="flex items-start gap-2 text-left text-danger">
      <span className="mt-1">
        <AlertIcon />
      </span>
      {children}
    </p>
  );
}

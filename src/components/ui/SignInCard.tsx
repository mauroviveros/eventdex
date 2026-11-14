import type { ReactNode } from "react";
import { EmailSignIn } from "@/components/ui/EmailSignIn";
import { GoogleSignIn } from "@/components/ui/GoogleSignIn";
import { SignInError } from "@/components/ui/SignInError";

type Props = {
  /** Where to go after signing in (already checked with safeNext). */
  next: string;
  /** The provider sent back an error (`?error=auth`). */
  failed: boolean;
  title: ReactNode;
  /** Who this sign-in is for, in a sentence or two. */
  children: ReactNode;
};

/**
 * The panel's sign-in: it sends whoever is already signed in on to `next`.
 * Mail sign-in only exists in development. The visitor's /ingresar is its
 * own title screen.
 */
export function SignInCard({ next, failed, title, children }: Props) {
  return (
    <div className="panel grid w-full max-w-sm gap-6 px-6 py-8">
      <div className="grid gap-2">
        <h1 className="font-wide text-title">{title}</h1>
        <p>{children}</p>
      </div>

      {failed && <SignInError />}

      <GoogleSignIn next={next} className="w-full">
        Ingresar con Google
      </GoogleSignIn>

      {process.env.NODE_ENV !== "production" && <EmailSignIn next={next} />}
    </div>
  );
}

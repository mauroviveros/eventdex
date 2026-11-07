import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertIcon } from "@/components/pixel/AlertIcon";
import { Button } from "@/components/ui/Button";
import { signInWithGoogle } from "@/lib/actions/auth";
import { getSessionUser, safeNext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { EmailSignIn } from "./EmailSignIn";

export const metadata: Metadata = {
  title: "Ingresar · Eventdex",
  robots: { index: false },
};

export default async function IngresarPage({
  searchParams,
}: PageProps<"/admin/ingresar">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const failed = params.error === "auth";

  const supabase = await createClient();
  if (await getSessionUser(supabase)) redirect(next);

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="panel grid w-full max-w-sm gap-6 px-6 py-8">
        <div className="grid gap-2">
          <h1 className="text-px-3">Ingresá a Eventdex</h1>
          <p>
            Para organizar tus eventos. Si te invitaron, usá el mismo mail de la
            invitación.
          </p>
        </div>

        {failed && (
          <p role="alert" className="flex items-start gap-2 text-danger">
            <span className="mt-1">
              <AlertIcon />
            </span>
            No pudimos completar el ingreso. Probá de nuevo.
          </p>
        )}

        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <Button type="submit" className="w-full">
            Ingresar con Google
          </Button>
        </form>

        {process.env.NODE_ENV !== "production" && <EmailSignIn next={next} />}
      </div>
    </main>
  );
}

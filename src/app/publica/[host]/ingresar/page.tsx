import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertIcon } from "@/components/pixel/AlertIcon";
import { Button } from "@/components/ui/Button";
import { EmailSignIn } from "@/components/ui/EmailSignIn";
import { signInWithGoogle } from "@/lib/actions/auth";
import { getSessionUser, safeNext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { requireHostOrganization } from "../organization";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

/**
 * The visitor's sign-in, on the org's own domain so the session cookie lands
 * here. `next` brings them back to the QR they scanned.
 */
export default async function IngresarPage({
  params,
  searchParams,
}: PageProps<"/publica/[host]/ingresar">) {
  const [{ host }, query] = await Promise.all([params, searchParams]);
  const { org } = await requireHostOrganization(host);
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  const failed = query.error === "auth";
  const fromQr = next.startsWith("/s/");

  if (await getSessionUser(await createClient())) redirect(next);

  return (
    <main className="mx-auto grid w-full max-w-3xl place-items-center px-4 py-10 sm:px-6">
      <div className="panel grid w-full max-w-sm gap-6 px-6 py-8">
        <div className="grid gap-2">
          <h1 className="text-px-3">
            {fromQr ? "Ingresá para sumar la medalla" : "Ingresá"}
          </h1>
          <p>
            Tus medallas quedan guardadas en tu cuenta de {org.name}. Entrás una
            vez y seguís escaneando.
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

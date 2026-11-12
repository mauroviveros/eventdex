import type { Metadata } from "next";
import { SignInCard } from "@/components/ui/SignInCard";
import { safeNext } from "@/lib/session";
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

  return (
    <main className="mx-auto grid w-full max-w-3xl place-items-center px-4 py-10 sm:px-6">
      <SignInCard
        next={next}
        failed={query.error === "auth"}
        title={
          next.startsWith("/s/") ? "Ingresá para sumar la medalla" : "Ingresá"
        }
      >
        Tus medallas quedan guardadas en tu cuenta de {org.name}. Entrás una vez
        y seguís escaneando.
      </SignInCard>
    </main>
  );
}

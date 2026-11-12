import type { Metadata } from "next";
import { SignInCard } from "@/components/ui/SignInCard";
import { safeNext } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ingresar · Eventdex",
  robots: { index: false },
};

/** The team's sign-in, on the root domain; without `next`, on to the panel. */
export default async function IngresarPage({
  searchParams,
}: PageProps<"/ingresar">) {
  const query = await searchParams;
  const next = safeNext(
    typeof query.next === "string" ? query.next : null,
    "/panel",
  );

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <SignInCard
        next={next}
        failed={query.error === "auth"}
        title="Ingresá a Eventdex"
      >
        Para organizar tus eventos. Si te invitaron, usá el mismo mail de la
        invitación.
      </SignInCard>
    </main>
  );
}

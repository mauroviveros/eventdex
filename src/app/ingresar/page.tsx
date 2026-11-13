import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInCard } from "@/components/ui/SignInCard";
import { getSessionUser, safeNext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

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
  if (await getSessionUser(await createClient())) redirect(next);

  return (
    // The landing's ground and wordmark: signing in is part of the site.
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-lcd-1">
      <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-8 lg:pt-10">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-display text-px-3 no-underline"
        >
          Eventdex<span className="sr-only">: volver al inicio</span>
        </Link>
      </header>
      <main className="grid place-items-center px-4 py-10">
        <SignInCard
          next={next}
          failed={query.error === "auth"}
          title="Ingresá a Eventdex"
        >
          Para organizar tus eventos. Si te invitaron, usá el mismo mail de la
          invitación.
        </SignInCard>
      </main>
    </div>
  );
}

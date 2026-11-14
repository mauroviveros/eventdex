import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmailSignIn } from "@/components/ui/EmailSignIn";
import { GoogleSignIn } from "@/components/ui/GoogleSignIn";
import { Monogram } from "@/components/ui/Monogram";
import { SignInError } from "@/components/ui/SignInError";
import { Logo } from "@/components/visitante/Medal";
import { cardDetails } from "@/domain/visitorCard";
import { logoUrl } from "@/lib/data/organizations";
import { getActiveEvent } from "@/lib/data/public";
import { getSessionUser, safeNext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { requireHostOrganization } from "../organization";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

/** Where they are going, from `next`. */
function titleFor(next: string) {
  if (next.startsWith("/mis-medallas")) return "Ingresá para ver tus medallas";
  return "Ingresá";
}

/**
 * The visitor's sign-in, on the org's own domain so the session cookie lands
 * here. Reached from pages that need a session and from a failed sign-in.
 * It opens like a game's title screen: the org, the active event, and signing
 * in is pressing START.
 */
export default async function IngresarPage({
  params,
  searchParams,
}: PageProps<"/publica/[host]/ingresar">) {
  const [{ host }, query] = await Promise.all([params, searchParams]);
  const { org } = await requireHostOrganization(host);
  const next = safeNext(typeof query.next === "string" ? query.next : null);
  const supabase = await createClient();
  // In parallel: the event read is wasted only when a session redirects.
  const [user, event] = await Promise.all([
    getSessionUser(supabase),
    getActiveEvent(supabase, org.id),
  ]);
  if (user) redirect(next);
  const details = event && cardDetails(event, new Date());

  return (
    <main className="mx-auto grid min-h-[80dvh] w-full max-w-sm content-center justify-items-center gap-10 px-4 py-10 text-center">
      <div className="grid justify-items-center gap-4">
        <p className="flex items-center gap-2 font-display text-px-1">
          {org.logo_path ? (
            <Logo
              src={logoUrl(org.logo_path)}
              mode="lleno"
              label=""
              className="size-8 shrink-0 object-contain"
            />
          ) : (
            <Monogram text={org.name} size="sm" />
          )}
          {org.name}
        </p>
        {event && (
          <p className="font-wide text-title text-accent-red break-words sm:text-title-lg">
            {event.title}
          </p>
        )}
        {details && (
          <p className="font-display text-px-1 text-accent-yellow">{details}</p>
        )}
      </div>

      <div className="grid w-full gap-4">
        <h1 className="flex items-center justify-center gap-2 font-display text-px-2">
          <span
            aria-hidden
            className="size-3 shrink-0 animate-blink bg-lcd-3"
          />
          {titleFor(next)}
        </h1>
        {query.error === "auth" && <SignInError />}
        <GoogleSignIn next={next} className="w-full">
          Ingresar con Google
        </GoogleSignIn>
        <p className="text-sm text-muted-foreground">
          De Google guardamos tu nombre, tu mail y tu foto. {org.name} los ve
          junto con los stands que visitaste.
        </p>
      </div>

      {process.env.NODE_ENV !== "production" && (
        <div className="w-full text-left">
          <EmailSignIn next={next} />
        </div>
      )}
    </main>
  );
}

import type { Metadata } from "next";
import { AlertIcon } from "@/components/pixel/AlertIcon";
import { Button } from "@/components/ui/Button";
import { CONTACT_EMAIL } from "@/lib/contact";
import { requireViewer } from "@/lib/data/viewer";

export const metadata: Metadata = {
  title: "Sin acceso · Eventdex",
  robots: { index: false },
};

/** Signed in, but with no organization and no invitation: no panel to show. */
export default async function SinAccesoPage() {
  const viewer = await requireViewer();
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="panel grid w-full max-w-sm gap-5 px-6 py-8">
        <h1 className="flex items-center gap-2 text-px-3">
          <AlertIcon size={24} />
          Sin acceso al panel
        </h1>
        <p>
          Tu cuenta
          {viewer.email ? (
            <>
              {" "}
              (<strong>{viewer.email}</strong>)
            </>
          ) : null}{" "}
          no pertenece a ninguna organización y no tiene invitaciones abiertas.
        </p>
        <p className="text-sm text-muted-foreground">
          Si te invitaron, ingresá con el mismo mail de la invitación. Si
          organizás eventos y querés usar Eventdex, escribinos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <form action="/auth/salir?next=/ingresar" method="post">
          <Button type="submit" className="w-full">
            Salir y probar con otra cuenta
          </Button>
        </form>
      </div>
    </main>
  );
}

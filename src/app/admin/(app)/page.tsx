import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import {
  listMyInvitations,
  listMyOrganizations,
} from "@/lib/data/organizations";
import { getViewer } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { AcceptInvitation } from "./AcceptInvitation";

export const metadata: Metadata = { title: "Tus organizaciones · Eventdex" };

const ROLE = { owner: "Owner", staff: "Staff" } as const;
const dateFormat = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
});

export default async function OrganizacionesPage() {
  // The layout already redirected anyone without a session.
  const user = await getViewer();
  if (!user) return null;
  const developer = user.isDeveloper;

  const supabase = await createClient();
  const [organizations, invitations] = await Promise.all([
    listMyOrganizations(supabase, user.id),
    user.email ? listMyInvitations(supabase, user.email) : [],
  ]);

  return (
    <div className="grid gap-10">
      <h1 className="text-px-3 sm:text-px-4">Tus organizaciones</h1>

      {invitations.length > 0 && (
        <section aria-labelledby="invitaciones" className="grid gap-4">
          <h2 id="invitaciones" className="text-px-2">
            Te invitaron
          </h2>
          <ul className="grid gap-3">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div className="grid gap-1">
                  <p className="font-display text-px-2">
                    {inv.organization?.name ?? "Una organización"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Como {ROLE[inv.role].toLowerCase()} · vence el{" "}
                    {dateFormat.format(new Date(inv.expires_at))}
                  </p>
                </div>
                <AcceptInvitation invitationId={inv.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {organizations.length > 0 ? (
        <section aria-label="Organizaciones" className="grid gap-4">
          {invitations.length > 0 && (
            <h2 className="text-px-2">Ya sos parte</h2>
          )}
          <ul className="grid gap-3">
            {organizations.map((org) => (
              <li
                key={org.id}
                className="flex flex-wrap items-center justify-between gap-4 border-2 border-lcd-3 px-5 py-4"
              >
                <p className="font-display text-px-2">{org.name}</p>
                <div className="flex items-center gap-3">
                  {org.status === "suspended" && (
                    <span className="border-2 border-dashed border-danger px-2 py-0.5 font-display text-px-1 text-danger">
                      Suspendida
                    </span>
                  )}
                  <span className="border-2 border-lcd-3 bg-lcd-1 px-2 py-0.5 font-display text-px-1">
                    {ROLE[org.role]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        invitations.length === 0 && (
          <section className="grid max-w-prose gap-3 border-2 border-dashed border-lcd-2 px-6 py-8">
            <h2 className="text-px-2">
              Todavía no sos parte de ninguna organización
            </h2>
            <p>
              Cuando alguien te invite, la invitación aparece acá. Revisá que
              hayas entrado con el mismo mail al que te invitaron
              {user.email ? (
                <>
                  : <strong>{user.email}</strong>
                </>
              ) : null}
              .
            </p>
          </section>
        )
      )}

      {developer && (
        <section className="grid justify-items-start gap-3 border-t-2 border-lcd-3 pt-6">
          <p className="text-muted-foreground">
            Sos developer: desde la plataforma das de alta organizaciones.
          </p>
          <Link
            href="/plataforma/organizaciones"
            className={buttonClass("secondary", "no-underline")}
          >
            Ir a la plataforma
          </Link>
        </section>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { buttonClass } from "@/components/ui/Button";
import { listAllOrganizations } from "@/lib/data/organizations";
import { platformMetadata } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

export function generateMetadata(): Promise<Metadata> {
  return platformMetadata("Organizaciones · Plataforma");
}

export default async function PlataformaOrganizacionesPage({
  searchParams,
}: PageProps<"/admin/plataforma/organizaciones">) {
  const { creada } = await searchParams;
  const supabase = await createClient();
  const organizations = await listAllOrganizations(supabase);

  return (
    <>
      <TopBar
        title="Plataforma"
        actions={
          <Link
            href="/plataforma/organizaciones/nueva"
            className={buttonClass("primary", "no-underline")}
          >
            Nueva organización
          </Link>
        }
      />
      <PageBody>
        <h1 className="text-px-3 sm:text-px-4">Organizaciones</h1>

        {creada && (
          <p role="status" className="border-2 border-lcd-3 bg-lcd-1 px-4 py-3">
            Organización creada. Avisale al owner que entre con el mail invitado
            para aceptar.
          </p>
        )}

        {organizations.length === 0 ? (
          <section className="grid max-w-prose gap-3 border-2 border-dashed border-lcd-2 px-6 py-8">
            <h2 className="text-px-2">Todavía no hay organizaciones</h2>
            <p>
              Creá la primera: con el nombre, su dominio y el mail de quien va a
              ser owner.
            </p>
          </section>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl border-collapse text-left">
              <caption className="sr-only">
                Organizaciones de la plataforma
              </caption>
              <thead>
                <tr className="border-b-2 border-lcd-3 font-display text-px-1">
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Organización
                  </th>
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Dominio
                  </th>
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Estado
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-normal">
                    Equipo
                  </th>
                  <th scope="col" className="py-2 font-normal">
                    Invitación abierta
                  </th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr
                    key={org.id}
                    className="border-b-2 border-dashed border-lcd-2"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/plataforma/organizaciones/${org.slug}`}
                        className="block font-display text-px-2"
                      >
                        {org.name}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        {org.slug}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm">{org.hostname ?? "—"}</td>
                    <td className="py-3 pr-4">
                      {org.status === "active" ? (
                        <span className="font-display text-px-1">Activa</span>
                      ) : (
                        <span className="font-display text-px-1 text-danger">
                          Suspendida
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right font-display text-px-1 tabular-nums">
                      {org.members}
                    </td>
                    <td className="py-3 text-sm">
                      {org.pendingInvitations.length > 0
                        ? org.pendingInvitations.join(", ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { buttonClass } from "@/components/ui/Button";
import { listAllOrganizations } from "@/lib/data/organizations";
import { platformMetadata, requireDeveloper } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { OrganizationsTable } from "./OrganizationsTable";

export function generateMetadata(): Promise<Metadata> {
  return platformMetadata("Organizaciones · Plataforma");
}

export default async function PlataformaOrganizacionesPage({
  searchParams,
}: PageProps<"/panel/plataforma/organizaciones">) {
  await requireDeveloper();
  const { creada } = await searchParams;
  const supabase = await createClient();
  const organizations = await listAllOrganizations(supabase);

  return (
    <>
      <TopBar
        title="Organizaciones"
        actions={
          <Link
            href="/panel/plataforma/organizaciones/nueva"
            className={buttonClass("primary", "no-underline")}
          >
            Nueva organización
          </Link>
        }
      />
      <PageBody>
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
          <OrganizationsTable
            rows={organizations.map((o) => ({
              id: o.id,
              slug: o.slug,
              name: o.name,
              hostname: o.hostname,
              status: o.status,
              members: o.members,
              pendingInvitations: o.pendingInvitations,
            }))}
          />
        )}
      </PageBody>
    </>
  );
}

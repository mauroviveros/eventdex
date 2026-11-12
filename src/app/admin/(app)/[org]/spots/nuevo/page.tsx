import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { createSpotAction } from "@/lib/actions/spots";
import { requireOrg } from "@/lib/data/viewer";
import { SpotForm } from "../SpotForm";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/spots/nuevo">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Nuevo spot · ${org.name}` };
}

export default async function NuevoSpotPage({
  params,
}: PageProps<"/admin/[org]/spots/nuevo">) {
  const { org, support } = await requireOrg((await params).org);
  // Support mode is read-only: there's nothing to create.
  if (support) notFound();

  return (
    <>
      <TopBar
        title="Nuevo spot"
        crumbs={[{ label: "Spots", href: `/${org.slug}/spots` }]}
      />
      <PageBody>
        <div className="grid max-w-xl gap-8">
          <div className="grid gap-2">
            <h1 className="text-px-3 sm:text-px-4">Nuevo spot</h1>
            <p>
              Queda en el catálogo de la organización. Después lo ponés en cada
              evento, con su código y su QR.
            </p>
          </div>
          <SpotForm
            action={createSpotAction}
            org={org.slug}
            ids={{ organizationId: org.id }}
            submitLabel="Crear spot"
            pendingLabel="Creando…"
          />
        </div>
      </PageBody>
    </>
  );
}

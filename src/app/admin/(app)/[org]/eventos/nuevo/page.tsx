import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { listVenues } from "@/lib/data/events";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { NewEventForm } from "./NewEventForm";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/eventos/nuevo">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Nuevo evento · ${org.name}` };
}

export default async function NuevoEventoPage({
  params,
}: PageProps<"/admin/[org]/eventos/nuevo">) {
  const { org, support } = await requireOrg((await params).org);
  // Support mode is read-only: there's nothing to create.
  if (support) notFound();
  const venues = await listVenues(await createClient(), org.id);

  return (
    <>
      <TopBar title="Eventos" />
      <PageBody>
        <div className="grid max-w-xl gap-8">
          <div className="grid gap-2">
            <h1 className="text-px-3 sm:text-px-4">Nuevo evento</h1>
            <p>
              Se crea como borrador. Después le cargás las jornadas y lo
              publicás.
            </p>
          </div>
          <NewEventForm
            org={{
              id: org.id,
              slug: org.slug,
              timezone: org.default_timezone,
            }}
            venues={venues}
          />
        </div>
      </PageBody>
    </>
  );
}

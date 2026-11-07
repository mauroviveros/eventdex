import type { Metadata } from "next";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { getOrganizationBySlug } from "@/lib/data/organizations";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]">): Promise<Metadata> {
  const { org: slug } = await params;
  const org = await getOrganizationBySlug(await createClient(), slug);
  return org ? { title: `Eventos · ${org.name}` } : {};
}

/** An organization's events. The dashboard (metrics, filters, cards) arrives with R2's events. */
export default async function OrgEventsPage({
  params,
}: PageProps<"/admin/[org]">) {
  const { org: slug } = await params;
  // The layout already checked access and 404'd otherwise.
  const org = await getOrganizationBySlug(await createClient(), slug);
  if (!org) return null;

  return (
    <>
      <TopBar title="Eventos" />
      <PageBody>
        <h1 className="text-px-3 sm:text-px-4">{org.name}</h1>
        <section className="grid max-w-prose gap-3 border-2 border-dashed border-lcd-2 px-6 py-8">
          <h2 className="text-px-2">Todavía no hay eventos</h2>
          <p>
            Acá vas a ver cada evento de la organización, con sus stands, sus
            visitantes y las medallas que se juntaron.
          </p>
        </section>
      </PageBody>
    </>
  );
}

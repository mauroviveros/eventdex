import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrganizationEvent } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { PageHeader } from "../../../../_components/page-header";
import { SpotForm } from "../_components/spot-form";
import { createSpot } from "../actions";

export const metadata: Metadata = { title: "Nuevo spot" };

export default async function NewSpotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { membership } = await requireMembership();
  const { id } = await params;

  const event = await getOrganizationEvent(membership.organizationId, id);
  if (!event) notFound();

  return (
    <>
      <PageHeader title={`Nuevo spot · ${event.title}`} />
      <main className="p-4">
        <SpotForm
          action={createSpot.bind(null, event.id)}
          submitLabel="Crear spot"
        />
      </main>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { eventSiteUrl, getOrganizationEvent } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { getEventSpot } from "@/server/spots";
import { PageHeader } from "../../../../_components/page-header";
import { SpotForm } from "../_components/spot-form";
import { updateSpot } from "../actions";
import { SpotDangerZone } from "./_components/spot-danger-zone";
import { SpotQr } from "./_components/spot-qr";

export const metadata: Metadata = { title: "Detalle del spot" };

export default async function SpotDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; spotId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership } = await requireMembership();
  const { id, spotId } = await params;
  const query = await searchParams;

  const event = await getOrganizationEvent(membership.organizationId, id);
  if (!event) notFound();

  const spot = await getEventSpot(membership.organizationId, id, spotId);
  if (!spot) notFound();

  return (
    <>
      <PageHeader title={`${spot.name} · ${event.title}`}>
        <Badge variant="secondary" className="tabular-nums">
          {spot.scanCount} escaneo{spot.scanCount === 1 ? "" : "s"}
        </Badge>
      </PageHeader>
      <main className="flex max-w-2xl flex-col gap-4 p-4">
        <SpotForm
          action={updateSpot.bind(null, event.id, spot.id)}
          defaults={{
            name: spot.name,
            description: spot.description,
            location: spot.location,
            type: spot.type,
            avatarUrl: spot.avatar_url,
          }}
          submitLabel="Guardar cambios"
        />
        <SpotQr
          eventId={event.id}
          spotId={spot.id}
          siteUrl={eventSiteUrl(event.config)}
        />
        <SpotDangerZone
          eventId={event.id}
          spotId={spot.id}
          name={spot.name}
          scanCount={spot.scanCount}
          showDeleteError={query.deleteError === "1"}
        />
      </main>
    </>
  );
}

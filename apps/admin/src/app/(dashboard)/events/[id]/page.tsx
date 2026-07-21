import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getOrganizationEvent } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { PageHeader } from "../../_components/page-header";
import { EventForm } from "../_components/event-form";
import { updateEvent } from "../actions";
import { DangerZone } from "./_components/danger-zone";
import { ScheduleSection } from "./_components/schedule-section";

export const metadata: Metadata = { title: "Detalle del evento" };

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership } = await requireMembership();
  const { id } = await params;
  const query = await searchParams;

  const event = await getOrganizationEvent(membership.organizationId, id);
  if (!event) notFound();

  return (
    <>
      <PageHeader title={event.title}>
        <Badge variant={event.status === "ACTIVE" ? "default" : "secondary"}>
          {event.status === "ACTIVE" ? "Activo" : "Inactivo"}
        </Badge>
      </PageHeader>
      <main className="flex max-w-2xl flex-col gap-4 p-4">
        <EventForm
          action={updateEvent.bind(null, event.id)}
          defaults={{
            title: event.title,
            description: event.description,
            edition: event.edition,
            timezone: event.timezone,
            location: event.location,
          }}
          submitLabel="Guardar cambios"
        />
        <ScheduleSection
          event={{ id: event.id, timezone: event.timezone }}
          schedules={event.schedules}
          showError={query.scheduleError === "1"}
        />
        <DangerZone
          eventId={event.id}
          status={event.status}
          title={event.title}
        />
      </main>
    </>
  );
}

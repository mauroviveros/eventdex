import type { Metadata } from "next";
import { requireMembership } from "@/server/guard";
import { PageHeader } from "../../_components/page-header";
import { EventForm } from "../_components/event-form";
import { createEvent } from "../actions";

export const metadata: Metadata = { title: "Nuevo evento" };

export default async function NewEventPage() {
  await requireMembership();

  return (
    <>
      <PageHeader title="Nuevo evento" />
      <main className="p-4">
        <EventForm
          action={createEvent}
          submitLabel="Crear evento"
          withSchedule
        />
      </main>
    </>
  );
}

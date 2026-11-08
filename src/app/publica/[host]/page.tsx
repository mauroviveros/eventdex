import type { Metadata } from "next";
import { cache } from "react";
import { EventHome } from "@/components/visitante/EventHome";
import { formatEventDates } from "@/domain/events";
import { getActiveEvent } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import { requireHostOrganization } from "./organization";

// Metadata and page share one read per request.
const load = cache(async (host: string) => {
  const { org } = await requireHostOrganization(host);
  const event = await getActiveEvent(await createClient(), org.id);
  return { org, event };
});

export async function generateMetadata({
  params,
}: PageProps<"/publica/[host]">): Promise<Metadata> {
  const { org, event } = await load((await params).host);
  if (!event) return { description: `Los eventos de ${org.name}.` };
  return {
    // The layout's template only reaches child segments, not this page.
    title: { absolute: `${event.title} · ${org.name}` },
    // The event's own line, else when and where.
    description:
      event.summary ??
      [formatEventDates(event.schedules, event.timezone), event.venue?.name]
        .filter(Boolean)
        .join(" · "),
  };
}

/** The org's home: its active event (live, else next, else last), or an empty state. */
export default async function PublicaHome({
  params,
}: PageProps<"/publica/[host]">) {
  const { org, event } = await load((await params).host);

  return event ? (
    <EventHome event={event} now={new Date()} />
  ) : (
    <main className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-12 sm:px-6">
      <h1 className="text-px-3 sm:text-px-4">Todavía no hay eventos</h1>
      <p className="max-w-prose">
        Cuando {org.name} publique su próximo evento, lo vas a ver acá con sus
        fechas, su sede y las medallas para juntar.
      </p>
    </main>
  );
}

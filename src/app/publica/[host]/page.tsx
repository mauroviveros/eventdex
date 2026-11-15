import type { Metadata } from "next";
import { cache } from "react";
import { EventHome } from "@/components/visitante/EventHome";
import { getActiveEvent } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import { EventJsonLd, eventMetadata } from "./eventSeo";
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
  const { host } = await params;
  const { org, event } = await load(host);
  if (!event) return { description: `Los eventos de ${org.name}.` };
  return {
    // The layout's template only reaches child segments, not this page.
    title: { absolute: `${event.title} · ${org.name}` },
    ...eventMetadata(decodeURIComponent(host), org, event),
  };
}

/** The org's home: its active event (live, else next, else last), or an empty state. */
export default async function PublicaHome({
  params,
}: PageProps<"/publica/[host]">) {
  const { host } = await params;
  const { org, event } = await load(host);

  return event ? (
    <>
      <EventJsonLd host={decodeURIComponent(host)} org={org} event={event} />
      <EventHome event={event} now={new Date()} />
    </>
  ) : (
    <main className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-12 sm:px-6">
      <h1 className="font-wide text-title sm:text-title-lg">
        Todavía no hay eventos
      </h1>
      <p className="max-w-prose">
        Cuando {org.name} publique su próximo evento, lo vas a ver acá con sus
        fechas, su sede y las medallas para juntar.
      </p>
    </main>
  );
}

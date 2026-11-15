import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { EventHome } from "@/components/visitante/EventHome";
import { getPublicEvent } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import { EventJsonLd, eventMetadata } from "../../eventSeo";
import { requireHostOrganization } from "../../organization";

// Metadata and page share one read per request.
const load = cache(async (host: string, slug: string) => {
  const { org } = await requireHostOrganization(host);
  const event = await getPublicEvent(await createClient(), org.id, slug);
  if (!event) notFound();
  return { org, event };
});

export async function generateMetadata({
  params,
}: PageProps<"/publica/[host]/eventos/[slug]">): Promise<Metadata> {
  const { host, slug } = await params;
  const { org, event } = await load(host, slug);
  return {
    title: event.title,
    ...eventMetadata(decodeURIComponent(host), org, event),
  };
}

/** One published event of the org (past or upcoming), with the same view as the home. */
export default async function PublicEventPage({
  params,
}: PageProps<"/publica/[host]/eventos/[slug]">) {
  const { host, slug } = await params;
  const { org, event } = await load(host, slug);
  return (
    <>
      <EventJsonLd host={decodeURIComponent(host)} org={org} event={event} />
      <EventHome event={event} now={new Date()} />
    </>
  );
}

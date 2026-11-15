import type { Metadata } from "next";
import { cache } from "react";
import { formatEventDates } from "@/domain/events";
import {
  eventJsonLd,
  eventShare,
  type SeoEvent,
  serializeJsonLd,
} from "@/domain/seo";
import { eventUrl } from "@/domain/spots";
import {
  coverUrl,
  getPrimaryHostname,
  logoUrl,
} from "@/lib/data/organizations";
import { createPublicClient } from "@/lib/supabase/public";

type Org = { id: string; name: string; logo_path: string | null };
type SeoSource = SeoEvent & {
  slug: string;
  cover_path: string | null;
  visibility: "public" | "unlisted";
};

// Metadata and page share one read per request.
const primaryHost = cache((orgId: string) =>
  getPrimaryHostname(createPublicClient(), orgId),
);

/**
 * The event's page on the org's primary domain, whichever domain was asked
 * for, so a second domain doesn't compete with it as duplicate content.
 */
async function canonical(host: string, org: Org, event: SeoSource) {
  return eventUrl(
    (await primaryHost(org.id)) ?? host,
    encodeURIComponent(event.slug),
  );
}

/** The banner, else the organization's logo, else nothing. */
function shareImage(event: SeoSource, org: Org) {
  return (
    coverUrl(event.cover_path) ??
    (org.logo_path ? logoUrl(org.logo_path) : undefined)
  );
}

/**
 * Description, canonical URL, Open Graph and Twitter of an event's page. The
 * home shows the active event, so it points its canonical to the event's own
 * page.
 */
export async function eventMetadata(host: string, org: Org, event: SeoSource) {
  return eventShare({
    event,
    orgName: org.name,
    url: await canonical(host, org, event),
    image: shareImage(event, org),
    fallback: [
      formatEventDates(event.schedules, event.timezone),
      event.venue?.name,
    ],
  }) satisfies Metadata;
}

/** The event's structured data, for search engines. Renders nothing without it. */
export async function EventJsonLd({
  host,
  org,
  event,
}: {
  host: string;
  org: Org;
  event: SeoSource;
}) {
  const data = eventJsonLd({
    event,
    orgName: org.name,
    url: await canonical(host, org, event),
    image: shareImage(event, org),
  });
  if (data.length === 0) return null;
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD with `<` escaped
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

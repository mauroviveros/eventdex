import type { Metadata } from "next";
import { cache } from "react";
import { formatEventDates } from "@/domain/events";
import {
  eventJsonLd,
  eventShare,
  type SeoEvent,
  serializeJsonLd,
} from "@/domain/seo";
import { publicOrigin } from "@/domain/spots";
import { getPrimaryHostname, logoUrl } from "@/lib/data/organizations";
import { createPublicClient } from "@/lib/supabase/public";

type Org = { id: string; name: string; logo_path: string | null };
type SeoSource = SeoEvent & {
  slug: string;
  visibility: "public" | "unlisted";
};

// Metadata and page share one read per request.
const primaryHost = cache((orgId: string) =>
  getPrimaryHostname(createPublicClient(), orgId),
);

/**
 * The org's home on its primary domain, whichever domain was asked for, so a
 * second domain doesn't compete with it as duplicate content. The org has one
 * page: the event it shows is the active one.
 */
async function canonical(host: string, org: Org) {
  return `${publicOrigin((await primaryHost(org.id)) ?? host)}/`;
}

/** The organization's logo, else nothing (stored banners stay hidden). */
function shareImage(org: Org) {
  return org.logo_path ? logoUrl(org.logo_path) : undefined;
}

/**
 * Description, canonical URL, Open Graph and Twitter of the org's page, which
 * shows its active event.
 */
export async function eventMetadata(host: string, org: Org, event: SeoSource) {
  return eventShare({
    event,
    orgName: org.name,
    url: await canonical(host, org),
    image: shareImage(org),
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
    url: await canonical(host, org),
    image: shareImage(org),
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

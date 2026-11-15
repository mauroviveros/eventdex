import type { Metadata } from "next";
import { formatEventDates } from "@/domain/events";
import {
  eventDescription,
  eventJsonLd,
  type SeoEvent,
  serializeJsonLd,
} from "@/domain/seo";
import { eventUrl } from "@/domain/spots";
import { coverUrl, logoUrl } from "@/lib/data/organizations";

type Org = { name: string; logo_path: string | null };
type SeoSource = SeoEvent & {
  slug: string;
  cover_path: string | null;
  visibility: "public" | "unlisted";
};

const canonical = (host: string, event: SeoSource) =>
  eventUrl(host, encodeURIComponent(event.slug));

/** The banner, else the organization's logo, else nothing. */
function shareImage(event: SeoSource, org: Org) {
  return (
    coverUrl(event.cover_path) ??
    (org.logo_path ? logoUrl(org.logo_path) : undefined)
  );
}

/**
 * Description, canonical URL, Open Graph and Twitter of an event's page, per
 * domain. The home shows the active event, so it points its canonical to the
 * event's own page. An unlisted event is not indexed.
 */
export function eventMetadata(host: string, org: Org, event: SeoSource) {
  const url = canonical(host, event);
  const description = eventDescription(event, [
    formatEventDates(event.schedules, event.timezone),
    event.venue?.name,
  ]);
  const image = shareImage(event, org);
  const images = image ? [image] : undefined;
  return {
    description,
    alternates: { canonical: url },
    robots: event.visibility === "unlisted" ? { index: false } : undefined,
    openGraph: {
      type: "website",
      siteName: org.name,
      locale: "es_AR",
      url,
      title: event.title,
      description,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: event.title,
      description,
      images,
    },
  } satisfies Metadata;
}

/** The event's structured data, for search engines. Renders nothing without it. */
export function EventJsonLd({
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
    url: canonical(host, event),
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

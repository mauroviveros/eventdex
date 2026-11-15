/**
 * What search engines and link previews read from an event's page: its
 * description and its JSON-LD (schema.org `Event`, and `FAQPage` when the staff
 * wrote questions). Pure: the caller resolves URLs and images.
 */

type Schedule = { starts_at: string; ends_at: string };

export type SeoEvent = {
  title: string;
  summary: string | null;
  timezone: string;
  schedules: readonly Schedule[];
  venue: {
    name: string;
    address_line: string | null;
    city: string | null;
    state: string | null;
  } | null;
  links: { tickets: string | null };
  faqs: readonly { question: string; answer: string }[];
};

type JsonLd = Record<string, unknown>;

/** The event's own line; else when and where, already formatted by the caller. */
export function eventDescription(
  event: Pick<SeoEvent, "summary">,
  fallback: readonly (string | null | undefined)[],
) {
  return event.summary ?? (fallback.filter(Boolean).join(" · ") || undefined);
}

/**
 * schema.org `Event` plus `FAQPage`. An event without dates emits no `Event`:
 * Google rejects one without `startDate`.
 */
export function eventJsonLd({
  event,
  orgName,
  url,
  image,
}: {
  event: SeoEvent;
  orgName: string;
  url: string;
  image?: string;
}): JsonLd[] {
  const out: JsonLd[] = [];
  const starts = event.schedules.map((s) => Date.parse(s.starts_at));
  const ends = event.schedules.map((s) => Date.parse(s.ends_at));

  if (event.schedules.length > 0) {
    const { venue, links } = event;
    out.push({
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.summary ?? undefined,
      // UTC instants: unambiguous, whatever the event's zone.
      startDate: new Date(Math.min(...starts)).toISOString(),
      endDate: new Date(Math.max(...ends)).toISOString(),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      url,
      image: image ? [image] : undefined,
      organizer: { "@type": "Organization", name: orgName },
      location: venue
        ? {
            "@type": "Place",
            name: venue.name,
            address: {
              "@type": "PostalAddress",
              streetAddress: venue.address_line ?? undefined,
              addressLocality: venue.city ?? undefined,
              addressRegion: venue.state ?? undefined,
            },
          }
        : undefined,
      offers: links.tickets
        ? { "@type": "Offer", url: links.tickets }
        : undefined,
    });
  }

  if (event.faqs.length > 0) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: event.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }
  return out;
}

/** JSON for a `<script type="application/ld+json">`: `<` escaped so text can't close the tag. */
export function serializeJsonLd(data: readonly JsonLd[]) {
  return JSON.stringify(data.length === 1 ? data[0] : data).replace(
    /</g,
    "\\u003c",
  );
}

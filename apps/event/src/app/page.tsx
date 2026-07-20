import type { Metadata } from "next";
import { getEvent } from "@/server/events";
import type { Event } from "@/types";
import { resolveScheduleDateTime } from "@/utils";
import PageUpcoming from "./_components/status/upcoming";

// La landing se genera estáticamente y se revalida cada hora (ISR): sus datos
// (evento, ubicación, horario) cambian rara vez, y la cuenta regresiva es
// client-side, así que se sirve desde CDN sin sacrificar frescura.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const event = await getEvent();
  const title = `${event.title} | Lo de Charly TCG`;
  const description = event.description ?? undefined;
  const images = ["/logo.png"];

  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "es_AR",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/**
 * Structured data (schema.org/Event) para rich results en buscadores.
 * Las fechas se normalizan a ISO 8601 con `resolveScheduleDateTime` (igual que
 * el resto de la app interpreta los horarios de la DB).
 */
function eventJsonLd(event: Event) {
  const [schedule] = event.schedules;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    startDate: schedule
      ? resolveScheduleDateTime(schedule.start_datetime).toISO()
      : undefined,
    endDate: schedule
      ? resolveScheduleDateTime(schedule.end_datetime).toISO()
      : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.location.address,
        addressLocality: event.location.city,
        addressRegion: event.location.state,
        addressCountry: event.location.country,
      },
    },
  };
}

export default async function Home() {
  const event = await getEvent();

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serializado desde datos propios del evento
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event)) }}
      />
      <PageUpcoming event={event} />
    </>
  );
}

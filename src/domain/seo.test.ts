import { describe, expect, it } from "vitest";
import {
  eventDescription,
  eventJsonLd,
  type SeoEvent,
  serializeJsonLd,
} from "./seo";

const event: SeoEvent = {
  title: "Expo Primavera",
  summary: "Dos días de stands.",
  timezone: "America/Argentina/Buenos_Aires",
  schedules: [
    { starts_at: "2026-11-14T13:00:00Z", ends_at: "2026-11-14T21:00:00Z" },
    { starts_at: "2026-11-15T13:00:00Z", ends_at: "2026-11-15T21:00:00Z" },
  ],
  venue: {
    name: "La Rural",
    address_line: "Av. Sarmiento 2704",
    city: "Buenos Aires",
    state: "CABA",
  },
  links: { tickets: "https://entradas.example/expo" },
  faqs: [{ question: "¿Hay estacionamiento?", answer: "Sí, gratis." }],
};

const input = {
  event,
  orgName: "Expo",
  url: "https://expo.example/eventos/expo-primavera",
  image: "https://cdn.example/banner.png",
};

describe("eventDescription", () => {
  it("prefers the event's own line, else when and where", () => {
    expect(eventDescription(event, ["sáb 14 nov"])).toBe("Dos días de stands.");
    expect(
      eventDescription({ summary: null }, ["sáb 14 nov", null, "La Rural"]),
    ).toBe("sáb 14 nov · La Rural");
    expect(eventDescription({ summary: null }, [null])).toBeUndefined();
  });
});

describe("eventJsonLd", () => {
  it("describes the event from its first start to its last end", () => {
    const [ld, faq] = eventJsonLd(input);

    expect(ld).toMatchObject({
      "@type": "Event",
      name: "Expo Primavera",
      startDate: "2026-11-14T13:00:00.000Z",
      endDate: "2026-11-15T21:00:00.000Z",
      url: input.url,
      image: [input.image],
      organizer: { name: "Expo" },
      location: {
        name: "La Rural",
        address: { addressLocality: "Buenos Aires" },
      },
      offers: { url: "https://entradas.example/expo" },
    });
    expect(faq).toMatchObject({ "@type": "FAQPage" });
  });

  it("emits no Event without dates, but keeps the FAQ", () => {
    const out = eventJsonLd({ ...input, event: { ...event, schedules: [] } });

    expect(out.map((o) => o["@type"])).toEqual(["FAQPage"]);
  });

  it("emits no FAQPage without questions, and no place or offer it can't fill", () => {
    const [ld, ...rest] = eventJsonLd({
      ...input,
      event: {
        ...event,
        faqs: [],
        venue: null,
        links: { tickets: null },
      },
    });

    expect(rest).toEqual([]);
    expect(ld?.location).toBeUndefined();
    expect(ld?.offers).toBeUndefined();
  });

  it("lists each question with its answer", () => {
    const faq = eventJsonLd(input)[1] as { mainEntity: unknown[] };

    expect(faq.mainEntity).toEqual([
      {
        "@type": "Question",
        name: "¿Hay estacionamiento?",
        acceptedAnswer: { "@type": "Answer", text: "Sí, gratis." },
      },
    ]);
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so staff text can't close the script tag", () => {
    const out = serializeJsonLd(
      eventJsonLd({
        ...input,
        event: {
          ...event,
          faqs: [{ question: "</script><b>", answer: "x" }],
        },
      }),
    );

    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toHaveLength(2);
  });
});

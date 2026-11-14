import Link from "next/link";
import { Chevron } from "@/components/pixel/Chevron";
import { buttonClass } from "@/components/ui/Button";
import { photoUrl } from "@/lib/data/organizations";
import type { getPastEditions } from "@/lib/data/public";
import type { PublicEvent } from "./EventHome";

/**
 * The event's own page, the parts the staff loads from the panel: about,
 * links, how to get there, questions, photos and past editions. Each one is
 * the body only; the page puts the heading (or folds it) around it.
 */

const EXTERNAL = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

/** The event's long description, one paragraph per blank line. */
export function About({ text }: { text: string }) {
  return (
    <div className="grid max-w-prose gap-4">
      {text.split(/\n{2,}/).map((p) => (
        <p key={p} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

type Links = PublicEvent["links"];

/** The links the staff loaded, as buttons: tickets first and filled. */
export function LinksBar({
  links,
  only,
}: {
  links: Links;
  /** Leaves out the ones not listed (the map lives in "Cómo llegar"). */
  only?: readonly (keyof Links)[];
}) {
  const items = (
    [
      ["tickets", "Entradas", "primary"],
      ["website", "Sitio web", "secondary"],
      ["instagram", "Instagram", "secondary"],
      ["map", "Cómo llegar", "secondary"],
    ] as const
  ).filter(([key]) => links[key] && (!only || only.includes(key)));
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-3">
      {items.map(([key, label, variant]) => (
        <li key={key}>
          <a
            href={links[key] ?? undefined}
            {...EXTERNAL}
            className={buttonClass(variant, "no-underline")}
          >
            {label}
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export const hasLinks = (links: Links, only?: readonly (keyof Links)[]) =>
  (Object.keys(links) as (keyof Links)[]).some(
    (k) => links[k] && (!only || only.includes(k)),
  );

/** The venue and a button to its map. */
export function HowToGet({
  venue,
  mapUrl,
}: {
  venue: PublicEvent["venue"];
  mapUrl: string | null;
}) {
  const address = venue
    ? [venue.address_line, venue.city, venue.state].filter(Boolean).join(" · ")
    : "";
  return (
    <div className="panel grid justify-items-start gap-4 p-4 sm:p-6">
      {venue && (
        <p className="grid gap-1">
          <span className="font-display text-px-2">{venue.name}</span>
          {address && <span>{address}</span>}
        </p>
      )}
      {mapUrl && (
        <a
          href={mapUrl}
          {...EXTERNAL}
          className={buttonClass("secondary", "no-underline")}
        >
          Abrir el mapa
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </a>
      )}
    </div>
  );
}

/** Questions as native disclosures: no script, keyboard and screen reader for free. */
export function Faq({ faqs }: { faqs: PublicEvent["faqs"] }) {
  return (
    <ul className="grid gap-3">
      {faqs.map((f) => (
        <li key={f.id}>
          <details className="group border-2 border-lcd-3 open:panel">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 font-display text-px-1">
              {f.question}
              <Chevron className="group-open:rotate-180" />
            </summary>
            <p className="max-w-prose px-4 pb-4">{f.answer}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}

/** The gallery: lazy, with its box reserved so the page doesn't jump while it loads. */
export function Gallery({ photos }: { photos: PublicEvent["photos"] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((p) => (
        <li key={p.id}>
          <figure className="grid gap-1">
            {/* biome-ignore lint/performance/noImgElement: photos come from Storage, at most 1.5 MB; next/image adds nothing here */}
            <img
              src={photoUrl(p.path)}
              // The caption below names the figure: repeating it here reads it twice.
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full border-2 border-lcd-3 object-cover"
            />
            {p.caption && (
              <figcaption className="text-sm">{p.caption}</figcaption>
            )}
          </figure>
        </li>
      ))}
    </ul>
  );
}

type Editions = Awaited<ReturnType<typeof getPastEditions>>;

const people = (n: number) =>
  `${n.toLocaleString("es-AR")} ${n === 1 ? "visitante" : "visitantes"}`;
const medals = (n: number) =>
  `${n.toLocaleString("es-AR")} ${n === 1 ? "medalla" : "medallas"}`;

/** Past editions as a ledger: each one a row that opens its page. */
export function PastEditions({ editions }: { editions: Editions }) {
  return (
    <ol className="grid gap-3">
      {editions.map((e) => (
        <li key={e.slug}>
          <Link
            href={`/eventos/${e.slug}`}
            className="grid min-h-11 gap-1 border-2 border-lcd-3 px-4 py-3 no-underline sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6"
          >
            <span className="font-display text-px-1">
              {[e.title, e.editionLabel].filter(Boolean).join(" · ")}
            </span>
            <span className="text-sm tabular-nums">
              {people(e.visitors)} · {medals(e.medals)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

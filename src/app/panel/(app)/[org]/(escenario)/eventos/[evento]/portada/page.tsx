import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { PortadaStrip } from "@/components/panel/PortadaStrip";
import { PreviewFrame } from "@/components/panel/PreviewFrame";
import { EventHome } from "@/components/visitante/EventHome";
import { MadeWith } from "@/components/visitante/MadeWith";
import { MARQUESINA } from "@/components/visitante/marquesina";
import { countdownState } from "@/domain/events";
import { orgRamp } from "@/domain/palette";
import { type PortadaPhase, previewNow } from "@/domain/portada";
import { getPublicEvent } from "@/lib/data/public";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ver portada" };

const PHASES: readonly PortadaPhase[] = ["proximo", "en-curso", "finalizado"];

/**
 * The event's public page as the team sees it, in the org's palette and in the
 * phase they pick (?fase=, the real one by default). Any status, drafts
 * included: RLS lets in only the org's members, and a developer in support mode.
 */
export default async function PortadaPage({
  params,
  searchParams,
}: PageProps<"/panel/[org]/eventos/[evento]/portada">) {
  const [{ org: slug, evento }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const { org } = await requireOrg(slug);
  const event = await getPublicEvent(await createClient(), org.id, evento, {
    drafts: true,
  });
  if (!event) notFound();

  const base = `/panel/${org.slug}/eventos/${event.slug}`;
  const nowReal = new Date();
  const kind = countdownState(event.schedules, event.timezone, nowReal).kind;
  const real: PortadaPhase | null =
    event.schedules.length === 0 ? null : kind === "faltan" ? "proximo" : kind;
  const shown = PHASES.find((p) => p === query.fase) ?? real;
  const now = (shown && previewNow(event.schedules, shown)) ?? nowReal;

  const page = `${base}?tab=pagina`;
  const missing = [
    !event.description && { label: "descripción", href: page },
    !event.faqs.length && { label: "preguntas", href: page },
    !event.photos.length && { label: "fotos", href: page },
    !event.venue && { label: "sede", href: base },
    !event.schedules.length && { label: "jornadas", href: base },
    !event.spots.length && { label: "spots", href: `${base}?tab=spots` },
  ].filter((m) => m !== false);

  const style = {
    ...Object.fromEntries(
      orgRamp(org.brand_color).map((tone, i) => [`--ramp-${i}`, tone]),
    ),
    // The index sticks under the team's bar (min-h-11), not under a public header.
    "--portada-top": "2.75rem",
  } as CSSProperties;

  return (
    <>
      <PortadaStrip
        base={base}
        draft={event.status === "draft"}
        real={real}
        shown={shown}
        missing={missing}
      />
      <div
        style={style}
        className={`ramp-scope scanlines min-h-dvh bg-lcd-0 text-lcd-3 ${MARQUESINA}`}
      >
        <PreviewFrame>
          <EventHome event={event} now={now} />
        </PreviewFrame>
        <MadeWith />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { z } from "zod";
import { RaffleStage } from "@/components/panel/RaffleStage";
import { Monogram } from "@/components/ui/Monogram";
import { Logo } from "@/components/visitante/Medal";
import { EVENTDEX_HUE, ramp, rampFromHex } from "@/domain/palette";
import { getEventBySlug } from "@/lib/data/events";
import { logoUrl } from "@/lib/data/organizations";
import { getLastDraw, listRaffleParticipants } from "@/lib/data/raffles";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sorteo en escenario" };

/**
 * The raffle to project on stage, painted with the org's brand and without the
 * panel's bar: it lives outside the shell's route group. The team opens it from
 * the Sorteo tab (?sorteo=<id>). The developer in support mode only watches.
 */
export default async function StagePage({
  params,
  searchParams,
}: PageProps<"/panel/[org]/eventos/[evento]/sorteo/proyectar">) {
  const [{ org: slug, evento }, { sorteo }] = await Promise.all([
    params,
    searchParams,
  ]);
  const back = `/panel/${slug}/eventos/${evento}?tab=sorteo`;
  const raffleId = z.guid().safeParse(sorteo);
  if (!raffleId.success) redirect(back);

  const { org, support } = await requireOrg(slug);
  const supabase = await createClient();
  const [event, raffle, last] = await Promise.all([
    getEventBySlug(supabase, org.id, evento),
    listRaffleParticipants(supabase, raffleId.data),
    getLastDraw(supabase, raffleId.data),
  ]);
  // A raffle of another event is as missing as one that doesn't exist.
  if (!event || !raffle || raffle.eventId !== event.id) notFound();

  const tones = org.brand_color
    ? rampFromHex(org.brand_color)
    : ramp(EVENTDEX_HUE);
  const style = Object.fromEntries(
    tones.map((tone, i) => [`--ramp-${i}`, tone]),
  ) as CSSProperties;

  return (
    <div
      style={style}
      className="ramp-scope scanlines min-h-dvh bg-lcd-0 text-lcd-3"
    >
      <header className="border-b-2 border-lcd-3">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 sm:px-6">
          <p className="flex min-h-11 min-w-0 items-center gap-3 font-display text-px-2">
            {org.logo_path ? (
              <Logo
                src={logoUrl(org.logo_path)}
                mode="lleno"
                label=""
                className="size-10 shrink-0 object-contain"
              />
            ) : (
              <Monogram text={org.name} />
            )}
            <span className="truncate">{org.name}</span>
          </p>
          <Link
            href={back}
            className="inline-flex min-h-11 items-center font-display text-px-1 underline"
          >
            Volver al sorteo
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b-2 border-lcd-3 pb-4">
          <div className="grid gap-1">
            <h1 className="text-px-3 wrap-anywhere sm:text-px-4">
              {raffle.title}
            </h1>
            <p className="text-lg">
              {event.title}
              {" · "}
              {raffle.minClaims === 1
                ? "alcanza con una medalla"
                : `hacen falta ${raffle.minClaims.toLocaleString("es-AR")} medallas`}
            </p>
          </div>
          <p className="text-lg">
            <span className="font-display text-px-2">
              {raffle.participants.length.toLocaleString("es-AR")}
            </span>{" "}
            {raffle.participants.length === 1 ? "participa" : "participan"} ·{" "}
            <span className="font-display text-px-2">
              {raffle.totalClaims.toLocaleString("es-AR")}
            </span>{" "}
            {raffle.totalClaims === 1 ? "medalla" : "medallas"} en juego
          </p>
        </div>
        <RaffleStage
          raffleId={raffleId.data}
          participants={raffle.participants}
          canDraw={!support}
          initial={last ? { kind: "won", ...last } : undefined}
        />
      </main>
    </div>
  );
}

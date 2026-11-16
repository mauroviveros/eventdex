"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef } from "react";
import { PixelIcon } from "@/components/pixel/icons";
import type { SpotType } from "@/domain/spots";
import { AWARD_BURSTS, lcdConfetti } from "@/lib/confetti";
import { Spot } from "./Spot";

export type Win = { title: string; position: number; slots: number | null };

type CelebrationProps = {
  /** Every award this medal crossed. */
  wins: readonly Win[];
  spot: { name: string; code: string; type: SpotType; logo?: string };
  /** The stand's coupon, when it has one: the new medal still gives it. */
  perk?: ReactNode;
  collectionHref: string;
};

/**
 * What /s/[id] shows when the medal just scanned crossed an award: the screen
 * flips (dark ground), the cup pops in and the place says how early they were.
 * With several at once, the one with a cap leads and the rest are named.
 * Confetti only without reduced motion; the screen reads the same without it.
 */
export function AwardCelebration({
  wins,
  spot,
  perk,
  collectionHref,
}: CelebrationProps) {
  const root = useRef<HTMLElement>(null);
  const lead = wins.find((w) => w.slots !== null) ?? wins[0];
  const others = wins.filter((w) => w !== lead);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!reduced && root.current) void lcdConfetti(root.current, AWARD_BURSTS);
  }, []);

  if (!lead) return null;
  return (
    <article
      ref={root}
      className="grid w-full max-w-sm justify-items-center gap-5 bg-lcd-3 px-6 py-8 text-center text-background"
    >
      <span className="stage-pop text-accent-yellow">
        <PixelIcon name="trofeo" size={48} />
      </span>
      <h1 className="font-wide text-title">¡Ganaste!</h1>
      {lead.slots !== null && (
        <p className="award-place font-wide text-numeral leading-none">
          <span aria-hidden>#{lead.position}</span>
          <span className="sr-only">Lugar {lead.position}</span>
          <span className="font-display text-px-2"> de {lead.slots}</span>
        </p>
      )}
      <p className="font-display text-px-2">{lead.title}</p>
      {others.length > 0 && (
        <p className="text-sm">
          También ganaste: {others.map((w) => w.title).join(", ")}.
        </p>
      )}
      <p className="text-sm">
        Pasá por la organización a retirarlo. Queda en tu perfil.
      </p>
      <div className="grid w-full grid-cols-[auto_1fr] items-center gap-3 border-2 border-background p-3 text-left">
        <Spot
          state="conseguido"
          size="xs"
          type={spot.type}
          logo={spot.logo}
          label={spot.name}
        />
        <span className="font-display text-px-1">
          {spot.code} · {spot.name} · medalla nueva
        </span>
      </div>
      {perk && <div className="w-full text-foreground">{perk}</div>}
      <Link
        href={collectionHref}
        className="inline-flex min-h-11 w-full items-center justify-center border-2 border-background font-display text-px-1 text-background no-underline hover:bg-background hover:text-lcd-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
      >
        Ver mis medallas
      </Link>
    </article>
  );
}

"use client";

import { Dialog } from "radix-ui";
import { useEffect, useState } from "react";
import { Sprite } from "@/components/pixel/Sprite";
import { buttonClass } from "@/components/ui/Button";
import type { SpotType } from "@/domain/spots";
import { Logo, Medal } from "./Medal";
import { PerkBlock, PerkSurprise } from "./PerkPlate";

type SpotView = {
  id: string;
  name: string;
  code: string;
  type: SpotType;
  logo?: string;
  description: string | null;
  booth: string | null;
  /** What the visitor may read: null for a surprise they have not unlocked. */
  perk: string | null;
  surprise: boolean;
};

type Props = {
  spots: readonly SpotView[];
  /** The ids of the spots this visitor already has. */
  claimedIds: readonly string[];
};

/**
 * The event's directory: the medals, each one opening the stand's sheet. A
 * stand with a perk carries a tag on its frame. The sheet rises from the
 * bottom on a phone and sits centered on a desktop.
 */
export function SpotDirectory({ spots, claimedIds }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  // The celebration links here with #ficha=<id>: open that stand's sheet once.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only on arrival; reopening on every refresh would undo a close
  useEffect(() => {
    const id = new URLSearchParams(window.location.hash.slice(1)).get("ficha");
    if (id && spots.some((s) => s.id === id)) setOpenId(id);
  }, []);
  const claimed = new Set(claimedIds);
  const open = spots.find((s) => s.id === openId);
  return (
    <>
      <ul className="flex flex-wrap gap-x-2 gap-y-6">
        {spots.map((s) => {
          const tag = s.surprise ? "Sorpresa" : s.perk ? "Beneficio" : null;
          return (
            <li key={s.id} className="relative">
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setOpenId(s.id)}
                className="grid justify-items-center"
              >
                <Medal
                  name={s.name}
                  code={s.code}
                  type={s.type}
                  logo={s.logo}
                  state={claimed.has(s.id) ? "conseguida" : "pendiente"}
                />
                {tag && (
                  <span className="sr-only">Con {tag.toLowerCase()}</span>
                )}
              </button>
              {tag && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-lcd-3 px-1 font-display text-px-1 text-background"
                >
                  {tag}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <Dialog.Root
        open={open !== undefined}
        onOpenChange={(o) => !o && setOpenId(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-lcd-3/60" />
          <Dialog.Content
            // The first thing to read is the sheet's top, not its "Cerrar" at the foot.
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLElement | null)?.focus();
            }}
            className="fixed inset-x-0 bottom-0 z-50 grid max-h-[85dvh] gap-5 overflow-y-auto border-t-2 border-lcd-3 bg-background p-6 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border-2"
          >
            {open && <Sheet spot={open} claimed={claimed.has(open.id)} />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function Sheet({ spot, claimed }: { spot: SpotView; claimed: boolean }) {
  const mode = claimed ? "lleno" : "silueta";
  return (
    <>
      <div className="grid grid-cols-[auto_1fr] items-center gap-4">
        <div
          className={`grid size-24 place-items-center overflow-hidden border-2 ${
            claimed
              ? "border-lcd-3 bg-plate shadow-plate"
              : "border-dashed border-lcd-2"
          }`}
        >
          {spot.logo ? (
            <Logo src={spot.logo} mode={mode} label="" />
          ) : (
            <Sprite type={spot.type} mode={mode} label="" />
          )}
        </div>
        <div className="grid gap-1">
          <span className="font-display text-px-1 text-muted-foreground">
            {[spot.code, spot.booth].filter(Boolean).join(" · ")}
          </span>
          <Dialog.Title className="font-display text-px-2">
            {spot.name}
          </Dialog.Title>
          <span className="font-display text-px-1">
            {claimed ? "Ya la tenés" : "Te falta"}
          </span>
        </div>
      </div>
      {spot.perk && <PerkBlock perk={spot.perk} claimed={claimed} />}
      {spot.surprise && <PerkSurprise />}
      {spot.description ? (
        <Dialog.Description className="text-base">
          {spot.description}
        </Dialog.Description>
      ) : (
        <Dialog.Description className="sr-only">
          Ficha del stand {spot.name}
        </Dialog.Description>
      )}
      {/* The surprise block already says to scan. */}
      {!claimed && !spot.surprise && (
        <p className="text-sm">
          Escaneá el QR del puesto para sumar esta medalla.
        </p>
      )}
      <Dialog.Close className={buttonClass("secondary", "w-full")}>
        Cerrar
      </Dialog.Close>
    </>
  );
}

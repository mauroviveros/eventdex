import Link from "next/link";
import { PixelIcon } from "@/components/pixel/icons";

/**
 * The perk a stand gives for its medal, in the moments the visitor meets it.
 * `PerkVoucher` is the celebration's coupon (what to show the stand);
 * `PerkBlock` is the stand's sheet. A surprise is only named until the medal is held.
 */

/** The celebration's coupon: a dashed plate, shown once, with a new medal. */
export function PerkVoucher({ perk }: { perk: string }) {
  return (
    <div className="grid gap-2 border-2 border-dashed border-lcd-3 bg-plate p-4 text-left">
      <span className="font-display text-px-1">Tu beneficio</span>
      <span className="text-balance break-words font-display text-px-2 hyphens-none">
        {perk}
      </span>
    </div>
  );
}

/** The sheet's block: dark, first thing under the stand's name. */
export function PerkBlock({
  perk,
  claimed,
}: {
  perk: string;
  /** Without the medal it is a promise, not yet theirs. */
  claimed: boolean;
}) {
  return (
    <div className="grid gap-2 bg-lcd-3 p-4 text-background">
      <span className="font-display text-px-1">
        {claimed ? "Tu beneficio" : "Beneficio al sumar la medalla"}
      </span>
      <span className="text-balance break-words font-wide text-title hyphens-none">
        {perk}
      </span>
    </div>
  );
}

/** A surprise perk before the medal: said to exist, never read. */
export function PerkSurprise() {
  return (
    <div className="grid gap-2 border-2 border-dashed border-lcd-3 p-4">
      <span className="inline-flex items-center gap-2 font-display text-px-1">
        <PixelIcon name="candado" size={16} />
        Beneficio sorpresa
      </span>
      <span className="text-sm">Escaneá el QR del stand para descubrirlo.</span>
    </div>
  );
}

/** The celebration, when the medal was already held: where the perk went. */
export function PerkInSheet({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center text-sm"
    >
      Su beneficio está en la ficha del stand
    </Link>
  );
}

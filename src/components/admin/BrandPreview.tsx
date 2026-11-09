import type { CSSProperties } from "react";
import { LcdFilters } from "@/components/pixel/LcdFilters";
import { Sprite } from "@/components/pixel/Sprite";
import { Monogram } from "@/components/ui/Monogram";
import { Logo } from "@/components/visitante/Medal";
import { rampFromHex } from "@/domain/palette";

const SCHEMES = [
  ["light", "Claro"],
  ["dark", "Oscuro"],
] as const;

/**
 * The public app in miniature, with a brand that may not be saved yet: its
 * ramp, its logo posterized, in both schemes the visitor's phone can pick.
 */
export function BrandPreview({
  color,
  name,
  logo,
}: {
  color: string;
  name: string;
  logo: string | null;
}) {
  const tones = rampFromHex(color);
  const style = Object.fromEntries(
    tones.map((tone, i) => [`--ramp-${i}`, tone]),
  ) as CSSProperties;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <LcdFilters ramp={tones} />
      {SCHEMES.map(([scheme, label]) => (
        <figure
          key={scheme}
          style={style}
          data-scheme={scheme}
          className="ramp-scope min-w-0 border-2 border-lcd-3 bg-lcd-0 text-lcd-3"
        >
          <div className="flex min-h-16 min-w-0 items-center gap-3 border-b-2 border-lcd-3 px-4 py-2 font-display text-px-2">
            {logo ? (
              <Logo
                src={logo}
                mode="lleno"
                label=""
                className="size-10 shrink-0 object-contain"
              />
            ) : (
              <Monogram text={name} />
            )}
            <span className="min-w-0 break-words">{name}</span>
          </div>
          <div className="grid gap-4 p-4">
            <p className="font-display text-px-3 text-accent-red">Tu evento</p>
            <div className="flex gap-4">
              <Sprite type="stand" label="Medalla conseguida" />
              <Sprite type="stand" mode="silueta" label="Medalla pendiente" />
            </div>
            <div
              aria-hidden
              className="grid h-6 grid-cols-4 border-2 border-lcd-3"
            >
              <span className="bg-lcd-0" />
              <span className="bg-lcd-1" />
              <span className="bg-lcd-2" />
              <span className="bg-lcd-3" />
            </div>
            <figcaption className="font-display text-px-1">{label}</figcaption>
          </div>
        </figure>
      ))}
    </div>
  );
}

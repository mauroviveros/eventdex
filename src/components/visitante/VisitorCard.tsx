import { Sprite } from "@/components/pixel/Sprite";
import { Monogram } from "@/components/ui/Monogram";
import type { PublicEvent } from "@/components/visitante/EventHome";
import { Logo } from "@/components/visitante/Medal";
import { pixelAvatar } from "@/domain/avatar";
import { formatEventDates } from "@/domain/events";
import type { SpotType } from "@/domain/spots";
import { logoUrl, spotLogoUrl } from "@/lib/data/organizations";

// Two rows: what a visitor shows off, not an inventory. The count says the rest.
const SHOWN = 12;

type Props = {
  account: { name: string; email: string; avatarUrl: string | null };
  org: { name: string; logo_path: string | null };
  event: PublicEvent;
  /** The medals this visitor has, at least one. */
  medals: readonly {
    id: string;
    name: string;
    type: SpotType;
    logoPath: string | null;
  }[];
  /** Spots in the event. */
  total: number;
  now: Date;
};

/** The visitor's card for one event: who they are and what they collected. */
export function VisitorCard({
  account,
  org,
  event,
  medals,
  total,
  now,
}: Props) {
  // Made to be shared: never print the mail of a profile without a name.
  const name = account.name === account.email ? "Visitante" : account.name;
  const details = [
    event.edition_label,
    formatEventDates(event.schedules, event.timezone, now),
    event.venue?.name,
  ]
    .filter(Boolean)
    .join(" · ");
  const count = medals.length;

  return (
    <section
      aria-label="Tu tarjeta de visitante"
      className="w-full max-w-sm bg-lcd-2 p-3"
    >
      <div className="grid justify-items-center gap-4 border-2 border-lcd-3 bg-plate p-4 text-center">
        <div className="grid gap-2">
          <h2 className="font-wide text-title text-accent-red break-words">
            {event.title}
          </h2>
          {details && (
            <p className="font-display text-px-1 text-accent-yellow">
              {details}
            </p>
          )}
        </div>

        {account.avatarUrl ? (
          <Photo src={account.avatarUrl} />
        ) : (
          <div className="border-2 border-lcd-3">
            <Monogram text={name} size="lg" />
          </div>
        )}

        <p className="line-clamp-2 w-full font-display text-px-3 break-words">
          {name}
        </p>

        <ul
          aria-label="Tus medallas"
          className="flex flex-wrap justify-center gap-1"
        >
          {medals.slice(0, SHOWN).map((m) => {
            const logo = spotLogoUrl(m.logoPath);
            return (
              <li
                key={m.id}
                className="grid size-10 place-items-center overflow-hidden border-2 border-lcd-3 bg-plate"
              >
                {logo ? (
                  <Logo src={logo} mode="lleno" label={m.name} />
                ) : (
                  <Sprite type={m.type} scale={2} label={m.name} />
                )}
              </li>
            );
          })}
        </ul>

        <p className="font-display text-px-2 tabular-nums">
          {count === total && count > 1
            ? `¡Las ${count} medallas!`
            : `${count} ${count === 1 ? "medalla" : "medallas"}`}
        </p>

        <p className="flex items-center gap-2 font-display text-px-1">
          {org.logo_path ? (
            <Logo
              src={logoUrl(org.logo_path)}
              mode="lleno"
              label=""
              className="size-8 shrink-0 object-contain"
            />
          ) : (
            <Monogram text={org.name} size="sm" />
          )}
          {org.name}
        </p>
      </div>
    </section>
  );
}

/**
 * The photo on the LCD: few pixels, four greys tinted by the ground. Always on
 * the light tones, because inverted a face reads as a negative.
 */
function Photo({ src }: { src: string }) {
  return (
    <div
      className="ramp-scope isolate size-36 box-content border-2 border-lcd-3 bg-lcd-0"
      data-scheme="light"
    >
      <svg aria-hidden className="absolute size-0">
        <filter id="foto-lcd" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0.2 0.5 0.8 1" />
            <feFuncG type="discrete" tableValues="0.2 0.5 0.8 1" />
            <feFuncB type="discrete" tableValues="0.2 0.5 0.8 1" />
          </feComponentTransfer>
        </filter>
      </svg>
      {/* biome-ignore lint/performance/noImgElement: a 36 px external photo, pixelated on purpose; next/image would smooth it */}
      <img
        src={pixelAvatar(src)}
        alt=""
        width={144}
        height={144}
        referrerPolicy="no-referrer"
        className="foto-lcd size-36"
      />
    </div>
  );
}

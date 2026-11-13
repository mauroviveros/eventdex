import { Sprite } from "@/components/pixel/Sprite";
import { Monogram } from "@/components/ui/Monogram";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { PublicEvent } from "@/components/visitante/EventHome";
import { Logo } from "@/components/visitante/Medal";
import type { SpotType } from "@/domain/spots";
import {
  CARD_MEDALS_SHOWN,
  cardCount,
  cardDetails,
  cardName,
} from "@/domain/visitorCard";
import { logoUrl, spotLogoUrl } from "@/lib/data/organizations";

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
  const name = cardName(account);
  const details = cardDetails(event, now);

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

        <UserAvatar
          name={name}
          src={account.avatarUrl}
          size="lg"
          className="border-2 border-lcd-3"
        />

        <p className="line-clamp-2 w-full font-display text-px-3 break-words">
          {name}
        </p>

        <ul
          aria-label="Tus medallas"
          className="flex flex-wrap justify-center gap-1"
        >
          {medals.slice(0, CARD_MEDALS_SHOWN).map((m) => {
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
          {cardCount(medals.length, total)}
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

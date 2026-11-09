import Link from "next/link";
import { Suspense } from "react";
import { ClockIcon } from "@/components/pixel/ClockIcon";
import { buttonClass } from "@/components/ui/Button";
import { Countdown } from "@/components/visitante/Countdown";
import { Medal } from "@/components/visitante/Medal";
import {
  countdownState,
  formatEventDates,
  formatScheduleTimes,
} from "@/domain/events";
import { listMyClaims } from "@/lib/data/claims";
import { coverUrl, spotLogoUrl } from "@/lib/data/organizations";
import type { getActiveEvent } from "@/lib/data/public";
import { getVisitorAccount } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

export type PublicEvent = NonNullable<
  Awaited<ReturnType<typeof getActiveEvent>>
>;

type Props = { event: PublicEvent; now: Date };

const SCAN =
  "Escaneá el QR de cada stand con la cámara del celular y sumá su medalla.";

/**
 * The event's home on the org's domain. Opens like the marquee of the old app
 * (date tab, title plate, venue tab, countdown), then the schedules as the
 * event's levels, then the medals to collect.
 */
export function EventHome({ event, now }: Props) {
  return (
    <main className="mx-auto grid w-full max-w-3xl gap-12 px-4 py-8 sm:px-6">
      <Marquee event={event} now={now} />
      {event.hasWinners && (
        <Link
          href={`/sorteo?evento=${event.slug}`}
          className={buttonClass("primary", "justify-self-center no-underline")}
        >
          Ver ganadores del sorteo
        </Link>
      )}
      {event.schedules.length > 1 && <Levels event={event} now={now} />}
      <Suspense fallback={<MedalsLoading event={event} />}>
        <Medals event={event} />
      </Suspense>
    </main>
  );
}

/** The event's banner, as uploaded. */
export function EventCover({ src, alt }: { src: string; alt: string }) {
  return (
    // shortcut: no stored dimensions, so the page shifts as it loads; save width and height at upload if it shows in Web Vitals
    // biome-ignore lint/performance/noImgElement: banners come from Storage, at most 1.5 MB; next/image adds nothing here
    <img
      src={src}
      alt={alt}
      fetchPriority="high"
      decoding="async"
      className="max-h-[70dvh] w-auto max-w-full border-2 border-lcd-3"
    />
  );
}

/** The banner if there is one, date on a tab, the title on a double-ruled plate, the venue on a tab, then the countdown. */
export function Marquee({ event, now }: Props) {
  const only = event.schedules.length === 1 ? event.schedules[0] : null;
  const dates = formatEventDates(event.schedules, event.timezone, now);
  const address = event.venue
    ? [event.venue.address_line, event.venue.city].filter(Boolean).join(" · ")
    : "";
  const subtitle = event.summary ?? event.edition_label;
  const cover = coverUrl(event.cover_path);
  const countdown = countdownState(event.schedules, event.timezone, now);

  return (
    <header className="grid min-h-[50dvh] grid-cols-[minmax(0,1fr)] content-center justify-items-center gap-8 text-center">
      {cover && <EventCover src={cover} alt={`Cartel de ${event.title}`} />}
      <div className="grid w-full justify-items-center">
        {dates && (
          <p className="-mb-0.5 flex items-center gap-2 border-2 border-b-0 border-plate-rule bg-plate px-4 py-2 font-display text-px-1 text-accent-yellow shadow-plate">
            <span className="text-muted-foreground">
              <ClockIcon />
            </span>
            <span>
              {dates}
              {only && ` · ${formatScheduleTimes(only, event.timezone)}`}
            </span>
          </p>
        )}
        <div className="panel relative z-10 grid w-full justify-items-center gap-3 px-4 py-6 sm:px-10">
          <h1 className="font-wide text-title text-accent-red sm:text-title-lg">
            {event.title}
          </h1>
          {subtitle && <p className="max-w-prose">{subtitle}</p>}
        </div>
        {event.venue && (
          <p className="-mt-0.5 grid gap-1 border-2 border-t-0 border-plate-rule bg-plate px-4 py-3 text-left shadow-plate">
            <span className="font-display text-px-1 text-accent-yellow">
              {event.venue.name}
            </span>
            {address && <span className="text-sm">{address}</span>}
          </p>
        )}
      </div>
      <div className="grid justify-items-center gap-4">
        <Countdown state={countdown} />
        {event.spots.length > 0 && countdown.kind !== "finalizado" && (
          <p className="max-w-prose">{SCAN}</p>
        )}
        {event.spots.length > 0 && (
          <a
            href="#medallas"
            className="inline-flex min-h-11 items-center font-display text-px-1 underline decoration-2 underline-offset-4"
          >
            {event.spots.length === 1
              ? "1 medalla para juntar"
              : `${event.spots.length.toLocaleString("es-AR")} medallas para juntar`}
          </a>
        )}
      </div>
    </header>
  );
}

function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="border-b-2 border-lcd-3 pb-2 text-px-2 sm:text-px-3">
      {children}
    </h2>
  );
}

/**
 * The schedules as levels: the one running (or next) lights up as a filled,
 * double-ruled cell; the ones done go quiet, the ones to come are dashed.
 */
export function Levels({ event, now }: Props) {
  const t = now.getTime();
  const on =
    event.schedules.find(
      (s) => Date.parse(s.starts_at) <= t && t <= Date.parse(s.ends_at),
    ) ?? event.schedules.find((s) => Date.parse(s.starts_at) > t);

  return (
    <section aria-labelledby="jornadas" className="grid gap-6">
      <SectionTitle id="jornadas">Jornadas</SectionTitle>
      <ol className="grid gap-3">
        {event.schedules.map((s, i) => {
          const done = Date.parse(s.ends_at) < t;
          const current = s.id === on?.id;
          const live = current && Date.parse(s.starts_at) <= t;
          return (
            <li
              key={s.id}
              aria-current={current ? "step" : undefined}
              className={`grid gap-1 px-5 py-4 ${
                // The level on now: a filled cell, the LCD's own way to say "on".
                current
                  ? "panel bg-lcd-1"
                  : done
                    ? "border-2 border-lcd-2 text-muted-foreground"
                    : "border-2 border-dashed border-lcd-2"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-px-2">
                  {s.label ?? `Día ${i + 1}`}
                </span>
                {current && (
                  <span className="flex items-center gap-2 font-display text-px-1">
                    {live && (
                      <span
                        aria-hidden
                        className="size-3 animate-blink bg-current"
                      />
                    )}
                    {live ? "Ahora" : "Próxima"}
                  </span>
                )}
                {done && <span className="font-display text-px-1">Hecha</span>}
              </span>
              <span>
                {formatEventDates([s], event.timezone, now)} ·{" "}
                {formatScheduleTimes(s, event.timezone)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** While the visitor's medals load: the collection's shape, still empty. */
function MedalsLoading({ event }: { event: PublicEvent }) {
  return (
    <section aria-labelledby="medallas" aria-busy className="grid gap-6">
      <SectionTitle id="medallas">Medallas</SectionTitle>
      <ul className="flex flex-wrap gap-x-2 gap-y-6">
        {event.spots.map((s) => (
          <li key={s.id} className="grid w-32 justify-items-center">
            <div className="size-24 border-2 border-dashed border-lcd-2" />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The collection: what this visitor already has, and silhouettes for the rest. */
async function Medals({ event }: { event: PublicEvent }) {
  const n = event.spots.length;
  const account = await getVisitorAccount();
  const mine = account
    ? await listMyClaims(await createClient(), event.id, account.id)
    : [];
  const claimed = new Set(mine.map((c) => c.event_spot_id));
  const got = event.spots.filter((s) => claimed.has(s.id)).length;
  const total = n.toLocaleString("es-AR");
  return (
    <section aria-labelledby="medallas" className="grid gap-6">
      <SectionTitle id="medallas">
        {got > 0
          ? `Medallas: ${got.toLocaleString("es-AR")} de ${total}`
          : n === 1
            ? "Medallas: 1 para juntar"
            : `Medallas: ${total} para juntar`}
      </SectionTitle>
      {n === 0 ? (
        <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
          Los stands del evento todavía no se cargaron. Volvé más cerca de la
          fecha.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-x-2 gap-y-6">
          {event.spots.map((s) => (
            <li key={s.id}>
              <Medal
                name={s.name}
                code={s.code}
                type={s.type}
                logo={spotLogoUrl(s.logoPath)}
                state={claimed.has(s.id) ? "conseguida" : "pendiente"}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { Countdown } from "@/components/visitante/Countdown";
import { Medal } from "@/components/visitante/Medal";
import {
  countdownState,
  formatEventDates,
  formatScheduleTimes,
} from "@/domain/events";
import type { getActiveEvent } from "@/lib/data/public";

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
      <Medals event={event} />
    </main>
  );
}

/** Date on a tab, the title on a double-ruled plate, the venue on a tab, then the countdown. */
export function Marquee({ event, now }: Props) {
  const only = event.schedules.length === 1 ? event.schedules[0] : null;
  const dates = formatEventDates(event.schedules, event.timezone, now);
  const address = event.venue
    ? [event.venue.address_line, event.venue.city].filter(Boolean).join(" · ")
    : "";
  const subtitle = event.summary ?? event.edition_label;

  return (
    <header className="grid min-h-[50dvh] place-content-center justify-items-center gap-8 text-center">
      <div className="grid justify-items-center">
        {dates && (
          <p className="relative z-10 -mb-0.5 border-2 border-b-0 border-lcd-2 bg-lcd-0 px-4 py-2 font-display text-px-1 text-accent-yellow">
            {dates}
            {only && ` · ${formatScheduleTimes(only, event.timezone)}`}
          </p>
        )}
        <div className="panel grid gap-3 px-6 py-6 sm:px-10">
          <h1 className="text-px-3 text-accent-red sm:text-px-4">
            {event.title}
          </h1>
          {subtitle && <p className="max-w-prose">{subtitle}</p>}
        </div>
        {event.venue && (
          <p className="relative z-10 -mt-0.5 grid gap-1 border-2 border-t-0 border-lcd-2 bg-lcd-0 px-4 py-3">
            <span className="font-display text-px-1 text-accent-yellow">
              {event.venue.name}
            </span>
            {address && <span className="text-sm">{address}</span>}
          </p>
        )}
      </div>
      <div className="grid justify-items-center gap-4">
        <Countdown
          state={countdownState(event.schedules, event.timezone, now)}
        />
        {event.spots.length > 0 && (
          <a
            href="#medallas"
            className="font-display text-px-1 underline decoration-2 underline-offset-4"
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

/** The collection as medals still to get: silhouettes with their codes. */
function Medals({ event }: { event: PublicEvent }) {
  const n = event.spots.length;
  return (
    <section aria-labelledby="medallas" className="grid gap-6">
      <SectionTitle id="medallas">
        {n === 1
          ? "Medallas: 1 para juntar"
          : `Medallas: ${n.toLocaleString("es-AR")} para juntar`}
      </SectionTitle>
      {n === 0 ? (
        <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
          Los stands del evento todavía no se cargaron. Volvé más cerca de la
          fecha.
        </p>
      ) : (
        <>
          <p className="max-w-prose">{SCAN}</p>
          <ul className="flex flex-wrap gap-x-2 gap-y-6">
            {event.spots.map((s) => (
              <li key={s.id}>
                <Medal
                  name={s.name}
                  code={s.code}
                  type={s.type}
                  state="pendiente"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ActivityFeed } from "@/components/panel/Overview";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { Button, buttonClass } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/shadcn/native-select";
import { DEFAULT_TIME_ZONE } from "@/domain/events";
import {
  type ActivityKind,
  isActivityKind,
  parseActivityCursor,
} from "@/domain/overview";
import { listEvents } from "@/lib/data/events";
import { type Activity, listActivityPage } from "@/lib/data/overview";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: PageProps<"/panel/[org]/actividad">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Actividad · ${org.name}` };
}

const KINDS: [ActivityKind | null, string][] = [
  [null, "Todo"],
  ["medalla", "Medallas"],
  ["premio", "Premios"],
  ["sorteo", "Sorteos"],
];

type Filters = { evento?: string; tipo?: ActivityKind; antes?: string };

const one = (v: string | string[] | undefined) =>
  typeof v === "string" && v ? v : undefined;

type Day = { label: string; items: Activity[] };

/** Each day of a page with its lines, in the order they came. */
function byDay(items: Activity[], timeZone: string) {
  const day = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  });
  return items.reduce<Day[]>((days, a) => {
    const label = day.format(new Date(a.at));
    const last = days.at(-1);
    return last?.label === label
      ? [...days.slice(0, -1), { label, items: [...last.items, a] }]
      : [...days, { label, items: [a] }];
  }, []);
}

/**
 * Everything that happened in the org, newest first, filtered by event and by
 * kind in the URL. Paged by cursor (?antes=): new medals keep arriving while
 * it is read, and numbered pages would repeat or skip lines.
 */
export default async function ActividadPage({
  params,
  searchParams,
}: PageProps<"/panel/[org]/actividad">) {
  const { org } = await requireOrg((await params).org);
  const query = await searchParams;
  const supabase = await createClient();
  const events = (await listEvents(supabase, org.id)).filter(
    (e) => e.status !== "draft",
  );

  const event = events.find((e) => e.slug === one(query.evento));
  const tipo = one(query.tipo);
  const kind = tipo && isActivityKind(tipo) ? tipo : undefined;
  const before = parseActivityCursor(query.antes);
  const page = await listActivityPage(supabase, org.id, {
    eventId: event?.id,
    kind,
    before,
  });

  const base = `/panel/${org.slug}/actividad`;
  const href = (f: Filters) => {
    const p = new URLSearchParams();
    if (f.evento) p.set("evento", f.evento);
    if (f.tipo) p.set("tipo", f.tipo);
    if (f.antes) p.set("antes", f.antes);
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const filters = { evento: event?.slug, tipo: kind };
  const titles = new Map(events.map((e) => [e.id, e.title]));
  // shortcut: one zone for the whole list (the event's, else the latest one's), split it per line if an org runs events in different zones
  const timeZone = (event ?? events[0])?.timezone ?? DEFAULT_TIME_ZONE;

  return (
    <>
      <TopBar title="Actividad" />
      <PageBody>
        <div className="flex flex-wrap items-end gap-3 max-sm:grid">
          <search className="min-w-64 flex-1">
            <form action={base} method="get" className="flex items-end gap-3">
              <div className="grid flex-1 gap-2">
                <label
                  htmlFor="actividad-evento"
                  className="font-display text-px-1"
                >
                  Evento
                </label>
                <NativeSelect
                  id="actividad-evento"
                  name="evento"
                  defaultValue={event?.slug ?? ""}
                >
                  <option value="">Todos los eventos</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.slug}>
                      {e.title}
                      {e.edition_label ? ` ${e.edition_label}` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              {kind && <input type="hidden" name="tipo" value={kind} />}
              <Button type="submit" variant="secondary">
                Ver
              </Button>
            </form>
          </search>
          <nav
            aria-label="Filtrar por tipo"
            className="flex overflow-x-auto border-2 border-lcd-3 max-sm:-mx-4 max-sm:border-x-0"
          >
            {KINDS.map(([k, label]) => (
              <Link
                key={label}
                href={href({ ...filters, tipo: k ?? undefined })}
                aria-current={k === (kind ?? null) ? "page" : undefined}
                className="flex min-h-11 shrink-0 items-center border-r-2 border-lcd-3 px-3 font-display text-px-1 whitespace-nowrap no-underline last:border-r-0 hover:bg-lcd-1 aria-[current=page]:bg-lcd-3 aria-[current=page]:text-lcd-0"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {page.items.length === 0 ? (
          <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
            <p className="font-display text-px-2">
              {before
                ? "No hay nada más atrás"
                : event || kind
                  ? "Nada con estos filtros"
                  : "Todavía no pasó nada"}
            </p>
            <p>
              {event || kind || before ? (
                <Link href={before ? href(filters) : base}>
                  {before ? "Volver a lo último" : "Ver toda la actividad"}
                </Link>
              ) : (
                "Las medallas, los premios y los sorteos aparecen acá a medida que pasan."
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {byDay(page.items, timeZone).map((d) => (
              <section key={d.label} className="grid gap-3">
                <h2 className="border-b-2 border-lcd-3 pb-2 text-px-2 first-letter:uppercase">
                  {d.label}
                </h2>
                <ActivityFeed
                  items={d.items}
                  timeZone={timeZone}
                  events={event ? undefined : titles}
                />
              </section>
            ))}
          </div>
        )}

        {(before || page.next) && (
          <nav aria-label="Páginas" className="flex flex-wrap gap-3">
            {before && (
              <Link
                href={href(filters)}
                className={buttonClass("secondary", "no-underline")}
              >
                Volver a lo último
              </Link>
            )}
            {page.next && (
              <Link
                href={href({ ...filters, antes: page.next })}
                className={buttonClass("primary", "no-underline")}
              >
                Ver anteriores
              </Link>
            )}
          </nav>
        )}
      </PageBody>
    </>
  );
}

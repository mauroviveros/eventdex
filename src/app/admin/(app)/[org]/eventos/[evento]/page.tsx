import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { buttonClass } from "@/components/ui/Button";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import {
  eventPhase,
  formatEventDates,
  formatScheduleTimes,
} from "@/domain/events";
import { load } from "./load";
import {
  AddScheduleForm,
  DeleteScheduleButton,
  PublishButton,
} from "./ScheduleForms";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/eventos/[evento]">): Promise<Metadata> {
  const { org: slug, evento } = await params;
  const { org, event } = await load(slug, evento);
  return { title: `${event.title} · ${org.name}` };
}

/** One event: its data, its schedules and the way to publish it. */
export default async function EventoPage({
  params,
}: PageProps<"/admin/[org]/eventos/[evento]">) {
  const { org: slug, evento } = await params;
  const { org, support, event } = await load(slug, evento);
  const phase = eventPhase(event.status, event.schedules);
  const draft = event.status === "draft";
  const editable = !support;

  return (
    <>
      <TopBar
        title="Eventos"
        actions={
          <Link
            href={`/${org.slug}`}
            className="flex min-h-11 items-center font-display text-px-1"
          >
            Volver a eventos
          </Link>
        }
      />
      <PageBody>
        <header className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-px-3 sm:text-px-4">{event.title}</h1>
            <PhaseBadge phase={phase} />
          </div>
          {event.summary && <p className="max-w-prose">{event.summary}</p>}
        </header>

        <dl className="grid max-w-3xl border-2 border-lcd-3 sm:grid-cols-3">
          {(
            [
              [
                "Fechas",
                formatEventDates(event.schedules, event.timezone) ??
                  "Sin fecha",
              ],
              ["Sede", event.venue?.name ?? "Sin sede"],
              ["Edición", event.edition_label ?? "—"],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 px-4 py-3 not-last:border-b-2 not-last:border-lcd-3 sm:not-last:border-r-2 sm:not-last:border-b-0"
            >
              <dt className="font-display text-px-1 text-muted-foreground">
                {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <nav aria-label="Del evento" className="flex flex-wrap gap-2">
          <Link
            href={`/${org.slug}/eventos/${event.slug}/spots`}
            className={buttonClass("secondary", "no-underline")}
          >
            Spots del evento
          </Link>
          <Link
            href={`/${org.slug}/eventos/${event.slug}/qr`}
            className={buttonClass("secondary", "no-underline")}
          >
            Hoja de QR
          </Link>
        </nav>

        {draft && editable && (
          <section aria-labelledby="publicar" className="grid gap-3">
            <h2 id="publicar" className="text-px-2">
              Publicación
            </h2>
            <p className="max-w-prose">
              Es un borrador: solo lo ve tu equipo. Al publicarlo aparece en el
              dominio de la organización.
            </p>
            <PublishButton
              org={org.slug}
              eventId={event.id}
              ready={event.schedules.length > 0}
            />
          </section>
        )}

        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_28rem] xl:items-start">
          <section
            aria-labelledby="jornadas"
            className="grid content-start gap-4"
          >
            <h2 id="jornadas" className="text-px-2">
              Jornadas
            </h2>
            {event.schedules.length === 0 ? (
              <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
                <p className="font-display text-px-2">
                  Todavía no hay jornadas
                </p>
                <p>
                  Cada jornada es un día del evento, con su horario. De ellas
                  sale si el evento es próximo, está en curso o terminó.
                </p>
              </div>
            ) : (
              <ol className="grid gap-2">
                {event.schedules.map((s, i) => {
                  const label = s.label ?? `Jornada ${i + 1}`;
                  return (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-2 border-lcd-3 px-4 py-3"
                    >
                      <div className="grid gap-1">
                        <p className="font-display text-px-2">{label}</p>
                        <p className="text-sm">
                          {formatEventDates([s], event.timezone)} ·{" "}
                          {formatScheduleTimes(s, event.timezone)}
                        </p>
                      </div>
                      {editable && (
                        <DeleteScheduleButton
                          org={org.slug}
                          id={s.id}
                          label={label}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {editable && (
            <section
              aria-labelledby="nueva-jornada"
              className="panel grid gap-6 p-6"
            >
              <h2 id="nueva-jornada" className="text-px-2">
                Nueva jornada
              </h2>
              <AddScheduleForm
                org={org.slug}
                eventId={event.id}
                timezone={event.timezone}
              />
            </section>
          )}
        </div>
      </PageBody>
    </>
  );
}

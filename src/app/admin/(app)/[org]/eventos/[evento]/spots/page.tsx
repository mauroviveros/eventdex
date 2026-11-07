import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { Sprite } from "@/components/pixel/Sprite";
import { ActionButton } from "@/components/ui/ActionButton";
import { buttonClass } from "@/components/ui/Button";
import { SPOT_TYPE_LABEL } from "@/domain/spots";
import { removeEventSpotAction } from "@/lib/actions/spots";
import { listEventSpots, listSpots } from "@/lib/data/spots";
import { createClient } from "@/lib/supabase/server";
import { load } from "../load";
import { AddEventSpotForm, EditEventSpotForm } from "./EventSpotForms";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/eventos/[evento]/spots">): Promise<Metadata> {
  const { org: slug, evento } = await params;
  const { event } = await load(slug, evento);
  return { title: `Spots · ${event.title}` };
}

/** The event's spots: which catalog spots are in it, with their code, booth and points. */
export default async function EventSpotsPage({
  params,
}: PageProps<"/admin/[org]/eventos/[evento]/spots">) {
  const { org: slug, evento } = await params;
  const { org, support, event } = await load(slug, evento);
  const supabase = await createClient();
  const [inEvent, catalog] = await Promise.all([
    listEventSpots(supabase, event.id),
    listSpots(supabase, org.id),
  ]);
  const used = new Set(inEvent.map((s) => s.spotId));
  const available = catalog.filter((s) => !s.archived_at && !used.has(s.id));
  const base = `/${org.slug}/eventos/${event.slug}`;

  return (
    <>
      <TopBar
        title="Eventos"
        actions={
          <>
            <Link
              href={base}
              className="flex min-h-11 items-center font-display text-px-1"
            >
              Volver al evento
            </Link>
            {inEvent.length > 0 && (
              <Link
                href={`${base}/qr`}
                className={buttonClass("primary", "no-underline")}
              >
                Hoja de QR
              </Link>
            )}
          </>
        }
      />
      <PageBody>
        <div className="grid gap-2">
          <h1 className="text-px-3 sm:text-px-4">Spots · {event.title}</h1>
          <p className="max-w-prose">
            Cada spot del evento tiene su código y su QR. El QR no cambia aunque
            edites el código o el nombre.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_28rem] xl:items-start">
          <section
            aria-labelledby="en-el-evento"
            className="grid content-start gap-4"
          >
            <h2 id="en-el-evento" className="text-px-2">
              En el evento ({inEvent.length})
            </h2>
            {inEvent.length === 0 ? (
              <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
                <p className="font-display text-px-2">
                  Todavía no hay spots en este evento
                </p>
                <p>
                  Agregalos desde el catálogo. Sin spots, el evento se puede
                  publicar, pero no hay medallas para juntar.
                </p>
              </div>
            ) : (
              <ul className="grid gap-2">
                {inEvent.map((s) => (
                  <li
                    key={s.id}
                    className={`border-2 ${
                      s.is_active
                        ? "border-lcd-3"
                        : "border-dashed border-lcd-2"
                    }`}
                  >
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3 hover:bg-lcd-1 [&::-webkit-details-marker]:hidden">
                        <span className="w-14 shrink-0 font-display text-px-2">
                          {s.code}
                        </span>
                        <Sprite
                          type={s.shown.type}
                          mode={s.is_active ? "lleno" : "inactivo"}
                          scale={3}
                          label={SPOT_TYPE_LABEL[s.shown.type]}
                        />
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <span className="truncate font-display text-px-1">
                            {s.shown.name}
                          </span>
                          <span className="text-sm">
                            {[
                              s.booth,
                              s.points === 1
                                ? "1 punto"
                                : `${s.points.toLocaleString("es-AR")} puntos`,
                              !s.is_active && "Inactivo",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        {!support && (
                          <span className="shrink-0 font-display text-px-1 group-open:hidden">
                            Editar
                          </span>
                        )}
                      </summary>
                      {!support && (
                        <div className="grid gap-6 border-t-2 border-lcd-3 px-4 py-5">
                          <EditEventSpotForm
                            org={org.slug}
                            spot={s}
                            catalogName={s.defaultName}
                          />
                          <ActionButton
                            action={removeEventSpotAction}
                            fields={{ org: org.slug, id: s.id }}
                            label="Quitar del evento"
                            pendingLabel="Quitando…"
                            ariaLabel={`Quitar ${s.shown.name} del evento`}
                            confirm={{
                              message: `Su QR deja de funcionar, también el que ya esté impreso. Si volvés a agregarlo, tiene un QR nuevo. Si el stand no vino, mejor desactivalo.`,
                              label: `Quitar ${s.code}`,
                            }}
                          />
                        </div>
                      )}
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!support && (
            <section
              aria-labelledby="agregar-spot"
              className="panel grid gap-6 p-6"
            >
              <h2 id="agregar-spot" className="text-px-2">
                Agregar desde el catálogo
              </h2>
              {available.length === 0 ? (
                <p>
                  {catalog.length === 0
                    ? "El catálogo está vacío."
                    : "Todos los spots del catálogo ya están en el evento."}{" "}
                  <Link href={`/${org.slug}/spots/nuevo`}>
                    Cargá un spot nuevo
                  </Link>
                  .
                </p>
              ) : (
                <AddEventSpotForm
                  org={org.slug}
                  eventId={event.id}
                  spots={available}
                />
              )}
            </section>
          )}
        </div>
      </PageBody>
    </>
  );
}

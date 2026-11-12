import Link from "next/link";
import { readTableQuery, type SearchParams, sortAndPage } from "@/domain/table";
import type { listSpots } from "@/lib/data/spots";
import { SPOT_SORTS } from "./query";
import { type Spot, SpotsTable } from "./SpotsTable";
import { AddEventSpotForm } from "./spots/EventSpotForms";

/** The event's spots: which catalog spots are in it, with their code, booth and points. */
export function SpotsTab({
  org,
  eventId,
  support,
  inEvent,
  catalog,
  params,
}: {
  org: string;
  eventId: string;
  support: boolean;
  inEvent: Spot[];
  catalog: Awaited<ReturnType<typeof listSpots>>;
  params: SearchParams;
}) {
  const used = new Set(inEvent.map((s) => s.spotId));
  const available = catalog.filter((s) => !s.archived_at && !used.has(s.id));
  const query = readTableQuery(params, SPOT_SORTS, "codigo");
  const { rows, page, pageCount } = sortAndPage(
    inEvent,
    (s) =>
      ({
        codigo: s.code,
        nombre: s.shown.name,
        puesto: s.booth ?? "",
        puntos: s.points,
      })[query.orden],
    query,
  );

  return (
    <>
      <p className="max-w-prose">
        Cada spot del evento tiene su código y su QR. El QR no cambia aunque
        edites el código o el nombre.
      </p>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_28rem] xl:items-start">
        <section
          aria-labelledby="en-el-evento"
          className="grid min-w-0 content-start gap-4"
        >
          <h2 id="en-el-evento" tabIndex={-1} className="text-px-2">
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
            <SpotsTable
              org={org}
              support={support}
              rows={rows}
              sort={query}
              page={page}
              pageCount={pageCount}
            />
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
                <Link href={`/${org}/spots/nuevo`}>Cargá un spot nuevo</Link>.
              </p>
            ) : (
              <AddEventSpotForm org={org} eventId={eventId} spots={available} />
            )}
          </section>
        )}
      </div>
    </>
  );
}

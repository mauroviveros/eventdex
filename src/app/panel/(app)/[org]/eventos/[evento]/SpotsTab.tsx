import Link from "next/link";
import { EditSheet } from "@/components/admin/EditSheet";
import { buttonClass } from "@/components/ui/Button";
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

  // One instance in one place: an add that changes the empty state must not
  // remount the sheet, or it would close in the middle of loading spots.
  const variant = inEvent.length === 0 ? "primary" : "secondary";
  const addAction = support ? null : catalog.length === 0 ? (
    <Link href={`/panel/${org}/spots?nuevo`} className={buttonClass(variant)}>
      Cargá un spot
    </Link>
  ) : (
    <EditSheet
      label="Agregar spots"
      title="Agregar desde el catálogo"
      description="Cada spot del evento tiene su código, que se genera solo, y su QR. El QR no cambia aunque después edites el código o el nombre."
      variant={variant}
    >
      {available.length === 0 ? (
        <p className="border-2 border-dashed border-lcd-2 px-4 py-6">
          Todos los spots del catálogo ya están en el evento.{" "}
          <Link
            href={`/panel/${org}/spots?nuevo`}
            className="underline decoration-2 underline-offset-4"
          >
            Cargá un spot nuevo
          </Link>
          .
        </p>
      ) : (
        <AddEventSpotForm org={org} eventId={eventId} spots={available} />
      )}
    </EditSheet>
  );

  return (
    <section aria-labelledby="en-el-evento" className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="en-el-evento" tabIndex={-1} className="text-px-2">
          En el evento ({inEvent.length})
        </h2>
        {addAction}
      </div>
      {inEvent.length === 0 ? (
        <div className="grid gap-2 border-2 border-dashed border-lcd-2 px-6 py-8 *:max-w-prose">
          <p className="font-display text-px-2">
            Todavía no hay spots en este evento
          </p>
          <p>
            {catalog.length === 0
              ? "Primero cargá los spots en el catálogo de la organización."
              : "Agregalos desde el catálogo."}{" "}
            Sin spots, el evento se puede publicar, pero no hay medallas para
            juntar.
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
  );
}

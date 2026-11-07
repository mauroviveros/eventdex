import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { Sprite } from "@/components/pixel/Sprite";
import { buttonClass } from "@/components/ui/Button";
import { SPOT_TYPE_LABEL } from "@/domain/spots";
import { listSpots } from "@/lib/data/spots";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/spots">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Spots · ${org.name}` };
}

/** The org's spot catalog: reused from one edition to the next. */
export default async function SpotsPage({
  params,
}: PageProps<"/admin/[org]/spots">) {
  const { org, support } = await requireOrg((await params).org);
  const spots = await listSpots(await createClient(), org.id);

  const newSpot = !support && (
    <Link
      href={`/${org.slug}/spots/nuevo`}
      className={buttonClass("primary", "no-underline")}
    >
      Nuevo spot
    </Link>
  );

  return (
    <>
      <TopBar title="Spots" actions={newSpot} />
      <PageBody>
        <div className="grid gap-2">
          <h1 className="text-px-3 sm:text-px-4">Catálogo de spots</h1>
          <p className="max-w-prose">
            Stands, atracciones, sponsors y actividades de la organización. Se
            cargan una vez y se ponen en cada evento.
          </p>
        </div>

        {spots.length === 0 ? (
          <section className="grid max-w-prose gap-3 border-2 border-dashed border-lcd-2 px-6 py-8">
            <h2 className="text-px-2">Todavía no hay spots</h2>
            <p>
              Cargá el primero: cada spot es un lugar del predio donde el
              visitante escanea un QR y gana una medalla.
            </p>
            {newSpot && <div>{newSpot}</div>}
          </section>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-3">
            {spots.map((spot) => (
              <li key={spot.id}>
                <Link
                  href={`/${org.slug}/spots/${spot.id}`}
                  className={`flex items-center gap-4 border-2 px-4 py-3 no-underline hover:bg-lcd-1 ${
                    spot.archived_at
                      ? "border-dashed border-lcd-2 text-lcd-2"
                      : "border-lcd-3"
                  }`}
                >
                  <Sprite
                    type={spot.type}
                    mode={spot.archived_at ? "inactivo" : "lleno"}
                    scale={4}
                    label={SPOT_TYPE_LABEL[spot.type]}
                  />
                  <span className="grid min-w-0 gap-1">
                    <span className="truncate font-display text-px-2">
                      {spot.name}
                    </span>
                    <span className="text-sm">
                      {[
                        SPOT_TYPE_LABEL[spot.type],
                        spot.uses === 0
                          ? "Sin eventos"
                          : spot.uses === 1
                            ? "En 1 evento"
                            : `En ${spot.uses} eventos`,
                        spot.archived_at && "Archivado",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}

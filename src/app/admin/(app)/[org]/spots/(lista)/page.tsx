import type { Metadata } from "next";
import Link from "next/link";
import { EditSheet } from "@/components/admin/EditSheet";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { buttonClass } from "@/components/ui/Button";
import { SPOT_TYPE_LABEL } from "@/domain/spots";
import { readTableQuery, sortAndPage } from "@/domain/table";
import { createSpotAction } from "@/lib/actions/spots";
import { listSpots } from "@/lib/data/spots";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { SpotForm } from "../SpotForm";
import { CatalogTable } from "./CatalogTable";
import { CATALOG_SORTS } from "./query";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/spots">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Spots · ${org.name}` };
}

/** The org's spot catalog: reused from one edition to the next. */
export default async function SpotsPage({
  params,
  searchParams,
}: PageProps<"/admin/[org]/spots">) {
  const { org, support } = await requireOrg((await params).org);
  const spots = await listSpots(await createClient(), org.id);
  // By default the order the read gives: active first, each group by name.
  const query = readTableQuery(await searchParams, CATALOG_SORTS, "estado");
  // shortcut: sorts in memory, move to .order() and .range() past ~500 spots per org
  const table = {
    ...sortAndPage(
      spots,
      (s) =>
        ({
          nombre: s.name,
          tipo: SPOT_TYPE_LABEL[s.type],
          eventos: s.uses,
          estado: s.archived_at ? 1 : 0,
        })[query.orden],
      query,
    ),
    sort: query,
  };

  // One instance, in the top bar: the empty state goes away with the first
  // spot, and a sheet inside it would close in the middle of loading spots.
  // The empty state opens it through ?nuevo, like the event's Spots tab.
  const newSpot = !support && (
    <EditSheet
      label="Nuevo spot"
      variant="primary"
      title="Nuevo spot"
      description="Queda en el catálogo de la organización. Después lo ponés en cada evento, con su código y su QR."
      openParam="nuevo"
    >
      <SpotForm
        action={createSpotAction}
        org={org.slug}
        ids={{ organizationId: org.id }}
        submitLabel="Crear spot"
        pendingLabel="Creando…"
        savedMessage="Spot creado."
      />
    </EditSheet>
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
              Cada spot es un lugar del predio donde el visitante escanea un QR
              y gana una medalla.
            </p>
            {newSpot && (
              // Opens the top bar's sheet: one instance, that stays open when
              // the first spot replaces this empty state.
              <Link
                href={`/${org.slug}/spots?nuevo`}
                scroll={false}
                className={buttonClass(
                  "primary",
                  "justify-self-start no-underline",
                )}
              >
                Cargá el primero
              </Link>
            )}
          </section>
        ) : (
          <CatalogTable org={org.slug} {...table} />
        )}
      </PageBody>
    </>
  );
}

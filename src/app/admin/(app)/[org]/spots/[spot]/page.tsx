import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { Sprite } from "@/components/pixel/Sprite";
import { ActionButton } from "@/components/ui/ActionButton";
import { SPOT_TYPE_LABEL } from "@/domain/spots";
import { setSpotArchivedAction, updateSpotAction } from "@/lib/actions/spots";
import { spotLogoUrl } from "@/lib/data/organizations";
import { SpotForm } from "../SpotForm";
import { load } from "./load";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/spots/[spot]">): Promise<Metadata> {
  const { org: slug, spot: id } = await params;
  const { org, spot } = await load(slug, id);
  return { title: `${spot.name} · ${org.name}` };
}

/** One catalog spot: edit it, archive it, and see which events use it. */
export default async function SpotPage({
  params,
}: PageProps<"/admin/[org]/spots/[spot]">) {
  const { org: slug, spot: id } = await params;
  const { org, support, spot } = await load(slug, id);
  const archived = spot.archived_at !== null;

  return (
    <>
      <TopBar
        title={spot.name}
        crumbs={[{ label: "Spots", href: `/${org.slug}/spots` }]}
      />
      <PageBody>
        <header className="flex flex-wrap items-center gap-4">
          <Sprite
            type={spot.type}
            mode={archived ? "inactivo" : "lleno"}
            scale={6}
            label={SPOT_TYPE_LABEL[spot.type]}
          />
          <div className="grid gap-1">
            <h1 className="text-px-3 sm:text-px-4">{spot.name}</h1>
            <p className="text-sm">
              {SPOT_TYPE_LABEL[spot.type]}
              {archived && " · Archivado: no se ofrece para eventos nuevos"}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_28rem] xl:items-start">
          <section aria-labelledby="usos" className="grid content-start gap-4">
            <h2 id="usos" className="text-px-2">
              En qué eventos está
            </h2>
            {spot.uses.length === 0 ? (
              <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
                Todavía no está en ningún evento. Se agrega desde la página de
                spots de cada evento.
              </p>
            ) : (
              <ul className="grid gap-2">
                {spot.uses.map((use) =>
                  use.event ? (
                    <li key={use.id}>
                      <Link
                        href={`/${org.slug}/eventos/${use.event.slug}/spots`}
                        className="flex items-center justify-between gap-3 border-2 border-lcd-3 px-4 py-3 no-underline hover:bg-lcd-1"
                      >
                        <span className="font-display text-px-2">
                          {use.event.title}
                        </span>
                        <span className="font-display text-px-1">
                          {use.code}
                        </span>
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
            <p className="max-w-prose text-sm text-muted-foreground">
              Los cambios del catálogo llegan a los borradores. Un evento
              publicado conserva el nombre, el tipo y el logo que tenía al
              publicarse.
            </p>
          </section>

          {!support && (
            <div className="grid content-start gap-8">
              <section
                aria-labelledby="editar"
                className="panel grid gap-6 p-6"
              >
                <h2 id="editar" className="text-px-2">
                  Editar
                </h2>
                <SpotForm
                  action={updateSpotAction}
                  org={org.slug}
                  ids={{ id: spot.id, organizationId: org.id }}
                  spot={spot}
                  logo={spotLogoUrl(spot.logo_path)}
                  submitLabel="Guardar"
                  pendingLabel="Guardando…"
                  savedMessage="Cambios guardados."
                />
              </section>
              <section aria-labelledby="archivo" className="grid gap-3">
                <h2 id="archivo" className="text-px-2">
                  {archived ? "Archivado" : "Archivar"}
                </h2>
                <p className="max-w-prose">
                  {archived
                    ? "Sigue en los eventos donde ya estaba. Desarchivalo para volver a ofrecerlo."
                    : "Deja de ofrecerse para eventos nuevos y sigue en los que ya lo usan. Los spots no se borran."}
                </p>
                <ActionButton
                  action={setSpotArchivedAction}
                  fields={{
                    org: org.slug,
                    id: spot.id,
                    archived: archived ? "0" : "1",
                  }}
                  label={archived ? "Desarchivar" : "Archivar"}
                  pendingLabel={archived ? "Desarchivando…" : "Archivando…"}
                />
              </section>
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}

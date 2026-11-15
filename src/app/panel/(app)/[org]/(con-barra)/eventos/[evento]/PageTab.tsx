import {
  About,
  Faq,
  Gallery,
  HowToGet,
  hasLinks,
  LinksBar,
} from "@/components/visitante/PortadaSections";
import { photoUrl } from "@/lib/data/organizations";
import { MAX_PHOTOS } from "@/lib/event-page";
import { FaqList } from "./FaqList";
import type { load } from "./load";
import { AddFaqForm, AddPhotoForm, PageDataForm, PhotoRow } from "./PageForms";

type Loaded = Awaited<ReturnType<typeof load>>;

const HERO_LINKS = ["tickets", "website", "instagram"] as const;

function Empty({ children }: { children: string }) {
  return (
    <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
      {children}
    </p>
  );
}

/**
 * The event's Página tab: what the staff loads for the public page (long
 * description, links, questions and photos), with a preview of how it reads.
 * Read-only in support mode.
 */
export function PageTab({
  org,
  event,
  support,
}: {
  org: Loaded["org"];
  event: Loaded["event"];
  support: boolean;
}) {
  const links = {
    website: event.website_url,
    instagram: event.instagram_url,
    tickets: event.tickets_url,
    map: event.map_url,
  };
  const ids = { org: org.slug, organizationId: org.id, eventId: event.id };
  const empty =
    !event.description &&
    !hasLinks(links) &&
    event.faqs.length === 0 &&
    event.photos.length === 0;

  return (
    <>
      <p className="max-w-prose">
        Lo que se lee en la portada del evento, además de las fechas, los stands
        y los premios. Todo es opcional: lo que no cargues no se muestra.
      </p>

      <section aria-labelledby="vista-previa" className="grid gap-4">
        <h2 id="vista-previa" className="text-px-2">
          Vista previa
        </h2>
        {empty ? (
          <Empty>Todavía no cargaste nada. Lo que sumes se ve acá.</Empty>
        ) : (
          <div className="grid gap-8 border-2 border-dashed border-lcd-2 p-4 sm:p-6">
            {hasLinks(links, HERO_LINKS) && (
              <LinksBar links={links} only={HERO_LINKS} />
            )}
            {event.description && <About text={event.description} />}
            {(event.venue || event.map_url) && (
              <HowToGet venue={event.venue} mapUrl={event.map_url} />
            )}
            {event.faqs.length > 0 && <Faq faqs={event.faqs} />}
            {event.photos.length > 0 && <Gallery photos={event.photos} />}
          </div>
        )}
      </section>

      {support ? (
        <p className="max-w-prose border-2 border-lcd-3 px-4 py-3">
          En modo soporte la página se ve, pero no se edita.
        </p>
      ) : (
        <>
          <section aria-labelledby="datos" className="grid max-w-3xl gap-4">
            <h2 id="datos" className="text-px-2">
              Sobre el evento y links
            </h2>
            <PageDataForm
              ids={{ org: org.slug, eventId: event.id }}
              description={event.description}
              links={links}
            />
          </section>

          <section aria-labelledby="preguntas" className="grid max-w-3xl gap-4">
            <h2 id="preguntas" className="text-px-2">
              Preguntas frecuentes
            </h2>
            {event.faqs.length === 0 ? (
              <Empty>
                Todavía no hay preguntas. Sumá las que más te hacen: horarios,
                entradas, cómo llegar.
              </Empty>
            ) : (
              <FaqList org={org.slug} faqs={event.faqs} />
            )}
            <div className="panel grid gap-4 p-6">
              <h3 className="text-px-2">Nueva pregunta</h3>
              <AddFaqForm ids={ids} />
            </div>
          </section>

          <section aria-labelledby="fotos" className="grid max-w-3xl gap-4">
            <h2 id="fotos" className="text-px-2">
              Fotos
            </h2>
            {event.photos.length === 0 ? (
              <Empty>
                Todavía no hay fotos. Subí las de la edición anterior o del
                lugar: se ven en la portada.
              </Empty>
            ) : (
              <ul className="grid gap-3">
                {event.photos.map((p) => (
                  <PhotoRow
                    key={p.id}
                    org={org.slug}
                    photo={p}
                    url={photoUrl(p.path)}
                  />
                ))}
              </ul>
            )}
            {event.photos.length >= MAX_PHOTOS ? (
              <p className="border-2 border-lcd-3 px-4 py-3">
                Llegaste al máximo de {MAX_PHOTOS} fotos. Quitá alguna para
                subir otra.
              </p>
            ) : (
              <div className="panel grid gap-4 p-6">
                <h3 className="text-px-2">Nueva foto</h3>
                <AddPhotoForm
                  ids={ids}
                  left={MAX_PHOTOS - event.photos.length}
                />
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

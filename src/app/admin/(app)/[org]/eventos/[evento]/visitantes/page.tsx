import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { formatMoment } from "@/domain/events";
import { setRegistrationBlockedAction } from "@/lib/actions/claims";
import { listEventVisitors } from "@/lib/data/claims";
import { createClient } from "@/lib/supabase/server";
import { load } from "../load";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/eventos/[evento]/visitantes">): Promise<Metadata> {
  const { org: slug, evento } = await params;
  const { event } = await load(slug, evento);
  return { title: `Visitantes · ${event.title}` };
}

/**
 * Who registered in the event (their first medal), how many medals each has,
 * and the block: a blocked visitor keeps their medals but claims no more.
 */
export default async function VisitantesPage({
  params,
}: PageProps<"/admin/[org]/eventos/[evento]/visitantes">) {
  const { org: slug, evento } = await params;
  const { org, support, event } = await load(slug, evento);
  const visitors = await listEventVisitors(await createClient(), event.id);
  const blocked = visitors.filter((v) => v.blocked_at).length;

  return (
    <>
      <TopBar
        title="Eventos"
        actions={
          <Link
            href={`/${org.slug}/eventos/${event.slug}`}
            className="flex min-h-11 items-center font-display text-px-1"
          >
            Volver al evento
          </Link>
        }
      />
      <PageBody>
        <div className="grid gap-2">
          <h1 className="text-px-3 sm:text-px-4">Visitantes · {event.title}</h1>
          <p className="max-w-prose">
            Se registran con su primera medalla. Si bloqueás a alguien, conserva
            lo que juntó pero no suma más.
          </p>
        </div>

        {visitors.length === 0 ? (
          <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
            <p className="font-display text-px-2">Todavía no hay visitantes</p>
            <p>Aparecen acá cuando escanean el primer QR durante el evento.</p>
          </div>
        ) : (
          <section aria-labelledby="lista" className="grid gap-4">
            <h2 id="lista" className="text-px-2">
              {visitors.length === 1
                ? "1 visitante"
                : `${visitors.length.toLocaleString("es-AR")} visitantes`}
              {blocked > 0 &&
                ` · ${blocked} ${blocked === 1 ? "bloqueado" : "bloqueados"}`}
            </h2>
            <ul className="grid gap-2">
              {visitors.map((v) => (
                <li
                  key={v.id}
                  className={`flex flex-wrap items-center gap-x-6 gap-y-3 border-2 px-4 py-3 ${
                    v.blocked_at ? "border-dashed border-lcd-2" : "border-lcd-3"
                  }`}
                >
                  <div className="grid min-w-0 flex-1 basis-56 gap-0.5">
                    <span className="truncate font-display text-px-1">
                      {v.name}
                    </span>
                    {v.name !== v.email && (
                      <span className="truncate text-sm">{v.email}</span>
                    )}
                  </div>
                  <dl className="flex gap-6 text-sm">
                    <div className="grid">
                      <dt className="text-muted-foreground">Medallas</dt>
                      <dd className="font-display text-px-1 tabular-nums">
                        {v.medals}
                      </dd>
                    </div>
                    <div className="grid">
                      <dt className="text-muted-foreground">Desde</dt>
                      <dd>{formatMoment(v.created_at, event.timezone)}</dd>
                    </div>
                  </dl>
                  {v.blocked_at && (
                    <span className="font-display text-px-1 text-danger">
                      Bloqueado
                    </span>
                  )}
                  {!support && (
                    <ActionButton
                      action={setRegistrationBlockedAction}
                      fields={{
                        org: org.slug,
                        id: v.id,
                        blocked: v.blocked_at ? "0" : "1",
                      }}
                      label={v.blocked_at ? "Desbloquear" : "Bloquear"}
                      pendingLabel={
                        v.blocked_at ? "Desbloqueando…" : "Bloqueando…"
                      }
                      ariaLabel={`${v.blocked_at ? "Desbloquear" : "Bloquear"} a ${v.name}`}
                      confirm={
                        v.blocked_at
                          ? undefined
                          : {
                              message: `${v.name} no va a poder sumar más medallas en este evento.`,
                              label: "Sí, bloquear",
                            }
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </PageBody>
    </>
  );
}

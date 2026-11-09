import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { buttonClass } from "@/components/ui/Button";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import { eventPhase } from "@/domain/events";
import { setOrganizationStatusAction } from "@/lib/actions/platform";
import { listEvents } from "@/lib/data/events";
import {
  getOrganizationBySlug,
  getOrganizationSettings,
  listTeam,
} from "@/lib/data/organizations";
import { platformMetadata } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

const load = cache(async (slug: string) => {
  const org = await getOrganizationBySlug(await createClient(), slug);
  return org ?? notFound();
});

export async function generateMetadata({
  params,
}: PageProps<"/admin/plataforma/organizaciones/[org]">): Promise<Metadata> {
  const org = await load((await params).org);
  return platformMetadata(`${org.name} · Plataforma`);
}

export default async function PlataformaOrganizacionPage({
  params,
}: PageProps<"/admin/plataforma/organizaciones/[org]">) {
  const org = await load((await params).org);
  const supabase = await createClient();
  const [settings, team, events] = await Promise.all([
    getOrganizationSettings(supabase, org.id),
    listTeam(supabase, org.id),
    listEvents(supabase, org.id),
  ]);
  const now = new Date();
  const suspended = org.status === "suspended";

  return (
    <>
      <TopBar
        title="Plataforma"
        actions={
          <Link
            href={`/${org.slug}`}
            className={buttonClass("secondary", "no-underline")}
          >
            Abrir en modo soporte
          </Link>
        }
      />
      <PageBody>
        <div className="grid gap-2">
          <h1 className="text-px-3 sm:text-px-4">{org.name}</h1>
          <p className="text-muted-foreground">{org.slug}</p>
        </div>

        <section className="grid max-w-prose justify-items-start gap-3">
          <h2 className="text-px-2">Estado</h2>
          {suspended ? (
            <>
              <p className="font-display text-px-1 text-danger">Suspendida</p>
              <p>Su portada y sus QR no abren.</p>
              <ActionButton
                action={setOrganizationStatusAction}
                fields={{ organizationId: org.id, status: "active" }}
                label="Reactivar"
                pendingLabel="Reactivando…"
              />
            </>
          ) : (
            <>
              <p className="font-display text-px-1">Activa</p>
              <ActionButton
                action={setOrganizationStatusAction}
                fields={{ organizationId: org.id, status: "suspended" }}
                label="Suspender"
                pendingLabel="Suspendiendo…"
                variant="danger"
                confirm={{
                  message: `La portada y los QR de ${org.name} dejan de abrir al instante. Después la podés reactivar.`,
                  label: "Sí, suspender",
                }}
              />
            </>
          )}
        </section>

        <section className="grid gap-3">
          <h2 className="text-px-2">Dominios</h2>
          {settings?.domains.length ? (
            <ul className="grid gap-1">
              {settings.domains.map((d) => (
                <li key={d.id}>
                  {d.hostname}
                  {d.is_primary && (
                    <span className="text-muted-foreground"> · principal</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Todavía no tiene dominios.</p>
          )}
        </section>

        <section className="grid gap-3">
          <h2 className="text-px-2">Miembros</h2>
          {team.members.length > 0 ? (
            <ul className="grid gap-1">
              {team.members.map((m) => (
                <li key={m.id}>
                  {m.profile?.email ?? "Cuenta borrada"}
                  <span className="text-muted-foreground">
                    {" "}
                    · {m.role === "owner" ? "Owner" : "Staff"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              Nadie aceptó la invitación todavía.
            </p>
          )}
          {team.invitations.map((i) => (
            <p key={i.id} className="text-sm text-muted-foreground">
              Invitación {i.expired ? "vencida" : "abierta"}: {i.email}
            </p>
          ))}
        </section>

        <section className="grid gap-3">
          <h2 className="text-px-2">Eventos</h2>
          {events.length > 0 ? (
            <ul className="grid gap-2">
              {events.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3">
                  <Link href={`/${org.slug}/eventos/${e.slug}`}>{e.title}</Link>
                  <PhaseBadge phase={eventPhase(e.status, e.schedules, now)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Todavía no tiene eventos.</p>
          )}
        </section>
      </PageBody>
    </>
  );
}

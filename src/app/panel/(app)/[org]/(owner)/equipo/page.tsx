import type { Metadata } from "next";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { Monogram } from "@/components/ui/Monogram";
import {
  changeMemberRoleAction,
  inviteMemberAction,
  removeMemberAction,
  revokeInvitationAction,
} from "@/lib/actions/team";
import { listTeam } from "@/lib/data/organizations";
import { requireOrgOwner } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./InviteForm";

const ROLE = { owner: "Owner", staff: "Staff" } as const;

export async function generateMetadata({
  params,
}: PageProps<"/panel/[org]/equipo">): Promise<Metadata> {
  const { org } = await requireOrgOwner((await params).org);
  return { title: `Equipo · ${org.name}` };
}

/** Who works in the org and who was invited. Your own row has no actions. */
export default async function EquipoPage({
  params,
}: PageProps<"/panel/[org]/equipo">) {
  const { org, viewer, support } = await requireOrgOwner((await params).org);
  const { members, invitations } = await listTeam(await createClient(), org.id);
  const date = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    timeZone: org.default_timezone,
  });

  return (
    <>
      <TopBar title="Equipo" />
      <PageBody>
        <h1 className="text-px-3 sm:text-px-4">Equipo</h1>

        <div className="grid gap-10 xl:grid-cols-[1fr_28rem] xl:items-start">
          <div className="grid gap-12">
            <section aria-labelledby="miembros" className="grid gap-4">
              <h2
                id="miembros"
                className="border-b-2 border-lcd-3 pb-2 text-px-2"
              >
                Miembros
              </h2>
              <ul className="grid gap-2">
                {members.map((member) => {
                  const { email, display_name, full_name } = member.profile;
                  const name = display_name || full_name || email;
                  const isMe = member.user_id === viewer.id;
                  const next = member.role === "owner" ? "staff" : "owner";
                  return (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-2 border-lcd-3 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Monogram text={name} size="sm" />
                        <div className="min-w-0">
                          <p className="break-words">
                            {name}
                            {isMe && (
                              <span className="text-muted-foreground">
                                {" "}
                                (vos)
                              </span>
                            )}
                          </p>
                          {name !== email && (
                            <p className="text-sm break-all text-muted-foreground">
                              {email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="font-display text-px-1">
                          {ROLE[member.role]}
                        </span>
                        {!support && !isMe && (
                          <>
                            <ActionButton
                              action={changeMemberRoleAction}
                              fields={{
                                org: org.slug,
                                id: member.id,
                                role: next,
                              }}
                              label={
                                next === "owner"
                                  ? "Hacer owner"
                                  : "Pasar a staff"
                              }
                              ariaLabel={
                                next === "owner"
                                  ? `Hacer owner a ${name}`
                                  : `Pasar a staff a ${name}`
                              }
                              pendingLabel="Cambiando…"
                            />
                            <ActionButton
                              action={removeMemberAction}
                              fields={{ org: org.slug, id: member.id }}
                              label="Quitar"
                              ariaLabel={`Quitar a ${name}`}
                              pendingLabel="Quitando…"
                              confirm={{
                                message: `${name} deja de tener acceso a ${org.name}. Para que vuelva, hay que invitar de nuevo a esa persona.`,
                                label: "Sí, quitar",
                              }}
                            />
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-labelledby="invitaciones" className="grid gap-4">
              <h2
                id="invitaciones"
                className="border-b-2 border-lcd-3 pb-2 text-px-2"
              >
                Invitaciones
              </h2>
              {invitations.length === 0 ? (
                <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
                  No hay invitaciones abiertas. Cuando invites a alguien, va a
                  aparecer acá hasta que entre con su cuenta.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {invitations.map((invitation) => (
                    <li
                      key={invitation.id}
                      className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-2 px-4 py-3 ${
                        invitation.expired
                          ? "border-dashed border-lcd-2"
                          : "border-lcd-3"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="break-all">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {ROLE[invitation.role]} ·{" "}
                          {invitation.expired
                            ? "Vencida"
                            : `Vence el ${date.format(new Date(invitation.expires_at))}`}
                        </p>
                      </div>
                      {!support && (
                        <div className="flex flex-wrap gap-2">
                          {invitation.expired && (
                            <ActionButton
                              action={inviteMemberAction}
                              fields={{
                                org: org.slug,
                                organizationId: org.id,
                                email: invitation.email,
                                role: invitation.role,
                              }}
                              label="Invitar de nuevo"
                              ariaLabel={`Invitar de nuevo a ${invitation.email}`}
                              pendingLabel="Invitando…"
                            />
                          )}
                          <ActionButton
                            action={revokeInvitationAction}
                            fields={{ org: org.slug, id: invitation.id }}
                            label="Revocar"
                            ariaLabel={`Revocar la invitación de ${invitation.email}`}
                            pendingLabel="Revocando…"
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {!support && (
            <section aria-labelledby="invitar" className="panel grid gap-6 p-6">
              <h2 id="invitar" className="text-px-2">
                Invitar a alguien
              </h2>
              <InviteForm org={{ id: org.id, slug: org.slug }} />
            </section>
          )}
        </div>
      </PageBody>
    </>
  );
}

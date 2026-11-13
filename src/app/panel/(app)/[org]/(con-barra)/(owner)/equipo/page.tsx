import type { Metadata } from "next";
import { EditSheet } from "@/components/panel/EditSheet";
import { RowActions } from "@/components/panel/RowActions";
import { PageBody, TopBar } from "@/components/panel/TopBar";
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

/**
 * Who works in the org and who was invited, each with their actions behind a
 * ⋮ (your own row has none). Invitar opens a side sheet from the bar.
 */
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

  const invite = !support && (
    <EditSheet
      label="Invitar"
      variant="primary"
      title="Invitar a alguien"
      description="Entra con su cuenta de Google y queda en el equipo."
    >
      <InviteForm org={{ id: org.id, slug: org.slug }} />
    </EditSheet>
  );

  return (
    <>
      <TopBar title="Equipo" actions={invite} />
      <PageBody>
        <section aria-labelledby="miembros" className="grid max-w-4xl gap-4">
          <h2 id="miembros" className="text-px-2">
            Miembros
          </h2>
          <ul className="grid">
            {members.map((member) => {
              const { email, display_name, full_name } = member.profile;
              const name = display_name || full_name || email;
              const isMe = member.user_id === viewer.id;
              const next = member.role === "owner" ? "staff" : "owner";
              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-4 border-2 border-lcd-3 px-4 py-3 not-first:-mt-0.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Monogram text={name} size="sm" />
                    <div className="min-w-0">
                      <p className="break-words">
                        {name}
                        {isMe && (
                          <span className="text-muted-foreground"> (vos)</span>
                        )}
                      </p>
                      {name !== email && (
                        <p className="text-sm break-all text-muted-foreground">
                          {email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="font-display text-px-1">
                      {ROLE[member.role]}
                    </span>
                    {!support && !isMe && (
                      <RowActions
                        name={name}
                        fallbackFocus="miembros"
                        actions={[
                          {
                            label:
                              next === "owner"
                                ? "Hacer owner"
                                : "Pasar a staff",
                            action: changeMemberRoleAction,
                            fields: {
                              org: org.slug,
                              id: member.id,
                              role: next,
                            },
                            done:
                              next === "owner"
                                ? `${name} ahora es owner.`
                                : `${name} ahora es staff.`,
                          },
                          {
                            label: "Quitar",
                            action: removeMemberAction,
                            fields: { org: org.slug, id: member.id },
                            done: `${name} ya no está en el equipo.`,
                            confirm: {
                              title: `Quitar a ${name}`,
                              message: `${name} deja de tener acceso a ${org.name}. Para que vuelva, hay que invitar de nuevo a esa persona.`,
                              label: "Sí, quitar",
                              pending: "Quitando…",
                            },
                          },
                        ]}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-labelledby="invitaciones"
          className="grid max-w-4xl gap-4"
        >
          <h2 id="invitaciones" className="text-px-2">
            Invitaciones
          </h2>
          {invitations.length === 0 ? (
            <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
              No hay invitaciones abiertas. Cuando invites a alguien, va a
              aparecer acá hasta que entre con su cuenta.
            </p>
          ) : (
            <ul className="grid">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className={`flex items-center justify-between gap-4 border-2 px-4 py-3 not-first:-mt-0.5 ${
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
                    <RowActions
                      name={invitation.email}
                      fallbackFocus="invitaciones"
                      actions={[
                        ...(invitation.expired
                          ? [
                              {
                                label: "Invitar de nuevo",
                                action: inviteMemberAction,
                                fields: {
                                  org: org.slug,
                                  organizationId: org.id,
                                  email: invitation.email,
                                  role: invitation.role,
                                },
                                done: `Invitación renovada para ${invitation.email}.`,
                              },
                            ]
                          : []),
                        {
                          label: "Revocar",
                          action: revokeInvitationAction,
                          fields: { org: org.slug, id: invitation.id },
                          done: `Invitación de ${invitation.email} revocada.`,
                        },
                      ]}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageBody>
    </>
  );
}

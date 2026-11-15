import type { ReactNode } from "react";
import { Badge } from "@/components/ui/shadcn/badge";
import { UserAvatar } from "@/components/ui/UserAvatar";

export type Role = "owner" | "staff";

const ROLE: Record<Role, string> = { owner: "Dueño", staff: "Equipo" };

// shortcut: the month is read in UTC, not in the org's zone; it only shifts for a first registration in the last hours of a month, store the zone with the registration if it matters
const SINCE = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

type Props = {
  account: { name: string; email: string; avatarUrl: string | null };
  teamRole?: Role;
  /** The first time they registered in an event of this organization. */
  since: string | null;
  /** The share action, null when there is no card to share yet. */
  share: ReactNode;
};

/**
 * The visitor, at the top of their page: who they are, and under a rule what is
 * theirs: their role in the team (only if they have one), since when they play
 * and the way to share their card.
 */
export function ProfileHeader({ account, teamRole, since, share }: Props) {
  const { name, email, avatarUrl } = account;
  const desde = since && `Desde ${SINCE.format(new Date(since))}`;
  const badge = teamRole && <Badge variant="secondary">{ROLE[teamRole]}</Badge>;
  const showEmail = email && email !== name;

  const footer = badge || desde || share;
  return (
    <section
      aria-label="Tu perfil"
      className="grid gap-4 border-2 border-lcd-3 bg-plate p-4 shadow-plate sm:gap-5 sm:p-6"
    >
      <div className="grid grid-cols-[auto_1fr] items-center gap-4 sm:gap-6">
        <UserAvatar
          name={name}
          src={avatarUrl}
          size="lg"
          className="size-20 border-2 border-lcd-3 sm:size-28"
        />
        <div className="grid min-w-0 gap-2">
          <p className="font-display text-px-3 [overflow-wrap:anywhere] sm:font-wide sm:text-title">
            {name}
          </p>
          {showEmail && (
            <p className="text-sm [overflow-wrap:anywhere] text-muted-foreground sm:text-base">
              {email}
            </p>
          )}
        </div>
      </div>
      {footer && (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t-2 border-lcd-1 pt-4">
          {badge || desde ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {badge}
              {desde && (
                <span className="font-display text-px-1 text-muted-foreground">
                  {desde}
                </span>
              )}
            </p>
          ) : (
            <span />
          )}
          {share}
        </div>
      )}
    </section>
  );
}

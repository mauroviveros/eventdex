import { raffleLink } from "@/domain/panelLink";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Who a signed-in visitor is to one organization: their role in its team, if
 * any, and since when they play. A failed read throws: the caller decides what
 * the page shows. Filtered by user: the team reads each other's rows under RLS.
 */
export async function readStanding(
  supabase: Supabase,
  organizationId: string,
  userId: string,
) {
  const [member, first] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("event_registrations")
      .select("created_at")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .order("created_at")
      .limit(1),
  ]);
  if (member.error) throw member.error;
  if (first.error) throw first.error;
  return {
    role: member.data?.role ?? null,
    /** The first time they registered in an event of the organization. */
    since: first.data[0]?.created_at ?? null,
  };
}

/**
 * The link from the public app to the raffle of the organization's active
 * event, in the panel on the root domain; null if it has no active event.
 * Only for the team: it is the caller who checks the role first.
 */
export async function getRaffleHref(
  supabase: Supabase,
  organization: { id: string; slug: string },
  rootDomain: string,
) {
  const { data, error } = await supabase
    .rpc("active_event", { p_organization_id: organization.id })
    .select("slug")
    .maybeSingle();
  if (error) throw error;
  return data ? raffleLink(rootDomain, organization.slug, data.slug) : null;
}

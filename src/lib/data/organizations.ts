import type { Supabase } from "@/lib/supabase/server";

/**
 * Reads for R1 screens. RLS decides what each user gets; these functions only
 * shape the query. A failed read throws, so the segment's error.tsx shows it.
 */

export async function isDeveloper(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** Organizations the user belongs to, with their role. */
export async function listMyOrganizations(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organization:organizations (id, slug, name, status)")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data.flatMap(({ role, organization }) =>
    organization ? [{ ...organization, role }] : [],
  );
}

/** Open invitations addressed to the user's email. */
export async function listMyInvitations(supabase: Supabase, email: string) {
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("id, role, expires_at, organization:organizations (name)")
    .eq("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at");
  if (error) throw error;
  return data;
}

/** Developer: every organization with its primary domain, team size and open invitations. */
export async function listAllOrganizations(supabase: Supabase) {
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `id, slug, name, status, created_at,
       domains:organization_domains (hostname, is_primary),
       members:organization_members (count),
       invitations:organization_invitations (email, accepted_at)`,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((org) => ({
    id: org.id,
    slug: org.slug,
    name: org.name,
    status: org.status,
    hostname: org.domains.find((d) => d.is_primary)?.hostname ?? null,
    members: org.members[0]?.count ?? 0,
    pendingInvitations: org.invitations
      .filter((i) => i.accepted_at === null)
      .map((i) => i.email),
  }));
}

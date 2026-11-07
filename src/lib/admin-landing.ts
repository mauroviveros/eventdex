/**
 * Where the admin sends you on arrival. The panel is per organization:
 * the developer goes to the platform, a member to their organization, and
 * anyone else has no access. Invitations are accepted before deciding.
 */
export function adminLanding({
  isDeveloper,
  organizations,
}: {
  isDeveloper: boolean;
  organizations: { slug: string }[];
}): string {
  if (isDeveloper) return "/plataforma/organizaciones";
  const first = organizations[0];
  if (first) return `/${first.slug}`;
  return "/sin-acceso";
}

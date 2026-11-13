/**
 * Where the admin sends you on arrival. The panel is per organization:
 * the developer goes to the platform, a member to their organization, and
 * anyone else has no access. Invitations are accepted before deciding.
 */
export function panelLanding({
  isDeveloper,
  organizations,
}: {
  isDeveloper: boolean;
  organizations: { slug: string }[];
}): string {
  if (isDeveloper) return "/panel/plataforma/organizaciones";
  const first = organizations[0];
  if (first) return `/panel/${first.slug}`;
  return "/panel/sin-acceso";
}

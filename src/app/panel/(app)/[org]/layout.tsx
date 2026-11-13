import { PanelShell, type Section } from "@/components/panel/PanelShell";
import { getVisitorAccount, requireOrg } from "@/lib/data/viewer";
import { SupportVisit } from "./SupportVisit";

/**
 * An organization's panel. Its members see it; the developer enters in
 * read-only support mode (logged); anyone else gets a 404.
 */
export default async function OrgLayout({
  children,
  params,
}: LayoutProps<"/panel/[org]">) {
  const { org: slug } = await params;
  const [{ viewer, org, mine, role, support }, account] = await Promise.all([
    requireOrg(slug),
    getVisitorAccount(),
  ]);

  const sections: Section[] = [
    {
      href: `/panel/${slug}`,
      label: "Eventos",
      icon: "eventos",
      exact: true,
      also: `/panel/${slug}/eventos`,
    },
    { href: `/panel/${slug}/spots`, label: "Spots", icon: "spots" },
    { href: `/panel/${slug}/sedes`, label: "Sedes", icon: "sedes" },
  ];
  if (role === "owner" || support) {
    sections.push(
      { href: `/panel/${slug}/equipo`, label: "Equipo", icon: "equipo" },
      { href: `/panel/${slug}/ajustes`, label: "Ajustes", icon: "ajustes" },
    );
  }
  if (viewer.isDeveloper) {
    sections.push({
      href: "/panel/plataforma/organizaciones",
      label: "Plataforma",
      icon: "plataforma",
    });
  }

  return (
    <PanelShell
      account={
        account ?? { name: "", email: viewer.email ?? "", avatarUrl: null }
      }
      sections={sections}
      org={{
        current: { slug: org.slug, name: org.name, role },
        all: mine.map((m) => ({ slug: m.slug, name: m.name })),
      }}
      notice={
        support && (
          <>
            <SupportVisit organizationId={org.id} />
            <p
              role="status"
              className="border-b-2 border-lcd-3 bg-lcd-1 px-3 py-2 font-display text-px-1"
            >
              Modo soporte · solo lectura
            </p>
          </>
        )
      }
    >
      {children}
    </PanelShell>
  );
}

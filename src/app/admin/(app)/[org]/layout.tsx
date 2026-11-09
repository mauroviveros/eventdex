import { AdminShell, type Section } from "@/components/admin/AdminShell";
import { requireOrg } from "@/lib/data/viewer";
import { SupportVisit } from "./SupportVisit";

/**
 * An organization's panel. Its members see it; the developer enters in
 * read-only support mode (logged); anyone else gets a 404.
 */
export default async function OrgLayout({
  children,
  params,
}: LayoutProps<"/admin/[org]">) {
  const { org: slug } = await params;
  const { viewer, org, mine, role, support } = await requireOrg(slug);

  const sections: Section[] = [
    {
      href: `/${slug}`,
      label: "Eventos",
      exact: true,
      also: `/${slug}/eventos`,
    },
    { href: `/${slug}/spots`, label: "Spots" },
    { href: `/${slug}/sedes`, label: "Sedes" },
  ];
  if (role === "owner" || support) {
    sections.push(
      { href: `/${slug}/equipo`, label: "Equipo" },
      { href: `/${slug}/ajustes`, label: "Ajustes" },
    );
  }
  if (viewer.isDeveloper) {
    sections.push({ href: "/plataforma/organizaciones", label: "Plataforma" });
  }

  return (
    <AdminShell
      email={viewer.email}
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
    </AdminShell>
  );
}

import { notFound } from "next/navigation";
import { AdminShell, type Section } from "@/components/admin/AdminShell";
import {
  getOrganizationBySlug,
  listMyOrganizations,
  logSupportAccess,
} from "@/lib/data/organizations";
import { requireViewer } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

/**
 * An organization's panel. Its members see it; the developer enters in
 * read-only support mode (logged); anyone else gets a 404.
 */
export default async function OrgLayout({
  children,
  params,
}: LayoutProps<"/admin/[org]">) {
  const { org: slug } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();

  const [org, mine] = await Promise.all([
    getOrganizationBySlug(supabase, slug),
    listMyOrganizations(supabase, viewer.id),
  ]);
  const membership = mine.find((m) => m.slug === slug);
  if (!org || (!membership && !viewer.isDeveloper)) notFound();

  const support = !membership;
  if (support) await logSupportAccess(supabase, org.id);

  const sections: Section[] = [{ href: `/${slug}`, label: "Eventos" }];
  if (viewer.isDeveloper) {
    sections.push({ href: "/plataforma/organizaciones", label: "Plataforma" });
  }

  return (
    <AdminShell
      email={viewer.email}
      sections={sections}
      org={{
        current: { slug: org.slug, name: org.name, role: membership?.role },
        all: mine.map((m) => ({ slug: m.slug, name: m.name })),
      }}
      notice={
        support && (
          <p
            role="status"
            className="border-b-2 border-lcd-3 bg-lcd-1 px-3 py-2 font-display text-px-1"
          >
            Modo soporte · solo lectura
          </p>
        )
      }
    >
      {children}
    </AdminShell>
  );
}

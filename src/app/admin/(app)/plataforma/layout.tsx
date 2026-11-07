import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireViewer } from "@/lib/data/viewer";

/** The platform does not exist for anyone but the developer: 404, not 403. */
export default async function PlataformaLayout({
  children,
}: LayoutProps<"/admin/plataforma">) {
  const viewer = await requireViewer();
  if (!viewer.isDeveloper) notFound();
  return (
    <AdminShell
      email={viewer.email}
      sections={[
        { href: "/plataforma/organizaciones", label: "Organizaciones" },
      ]}
    >
      {children}
    </AdminShell>
  );
}

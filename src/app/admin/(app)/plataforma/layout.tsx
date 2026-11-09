import { AdminShell } from "@/components/admin/AdminShell";
import { requireDeveloper } from "@/lib/data/viewer";

export default async function PlataformaLayout({
  children,
}: LayoutProps<"/admin/plataforma">) {
  const viewer = await requireDeveloper();
  return (
    <AdminShell
      email={viewer.email}
      sections={[
        { href: "/plataforma", label: "Resumen", exact: true },
        { href: "/plataforma/organizaciones", label: "Organizaciones" },
        { href: "/plataforma/facturacion", label: "Facturación" },
        { href: "/plataforma/auditoria", label: "Auditoría" },
      ]}
    >
      {children}
    </AdminShell>
  );
}

import { AdminShell } from "@/components/admin/AdminShell";
import { getVisitorAccount, requireDeveloper } from "@/lib/data/viewer";

export default async function PlataformaLayout({
  children,
}: LayoutProps<"/admin/plataforma">) {
  const [viewer, account] = await Promise.all([
    requireDeveloper(),
    getVisitorAccount(),
  ]);
  return (
    <AdminShell
      account={
        account ?? { name: "", email: viewer.email ?? "", avatarUrl: null }
      }
      sections={[
        { href: "/plataforma", label: "Resumen", icon: "resumen", exact: true },
        {
          href: "/plataforma/organizaciones",
          label: "Organizaciones",
          icon: "plataforma",
        },
        {
          href: "/plataforma/facturacion",
          label: "Facturación",
          icon: "facturacion",
        },
        {
          href: "/plataforma/auditoria",
          label: "Auditoría",
          icon: "auditoria",
        },
      ]}
    >
      {children}
    </AdminShell>
  );
}

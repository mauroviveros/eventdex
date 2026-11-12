import { AdminShell } from "@/components/admin/AdminShell";
import { getVisitorAccount, requireDeveloper } from "@/lib/data/viewer";

export default async function PlataformaLayout({
  children,
}: LayoutProps<"/panel/plataforma">) {
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
        {
          href: "/panel/plataforma",
          label: "Resumen",
          icon: "resumen",
          exact: true,
        },
        {
          href: "/panel/plataforma/organizaciones",
          label: "Organizaciones",
          icon: "plataforma",
        },
        {
          href: "/panel/plataforma/facturacion",
          label: "Facturación",
          icon: "facturacion",
        },
        {
          href: "/panel/plataforma/auditoria",
          label: "Auditoría",
          icon: "auditoria",
        },
      ]}
    >
      {children}
    </AdminShell>
  );
}

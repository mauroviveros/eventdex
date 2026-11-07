import { AdminHeader } from "@/components/admin/AdminHeader";
import { requireViewer } from "@/lib/data/viewer";

/** Signed-in area of the admin. Who sees what is RLS; this only sends strangers to /ingresar. */
export default async function AdminAppLayout({
  children,
}: LayoutProps<"/admin">) {
  const viewer = await requireViewer();

  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:bg-lcd-3 focus:px-3 focus:py-2 focus:text-lcd-0"
      >
        Ir al contenido
      </a>
      <AdminHeader email={viewer.email} isDeveloper={viewer.isDeveloper} />
      <main id="contenido" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}

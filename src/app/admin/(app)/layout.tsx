import { requireViewer } from "@/lib/data/viewer";

/**
 * Signed-in area of the admin: only sends strangers to /ingresar. Each area
 * (an organization, the platform) draws its own shell with its own sections.
 */
export default async function AdminAppLayout({
  children,
}: LayoutProps<"/admin">) {
  await requireViewer();
  return children;
}

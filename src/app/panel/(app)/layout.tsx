import type { Metadata } from "next";
import { Toaster } from "@/components/ui/shadcn/sonner";
import { requireViewer } from "@/lib/data/viewer";

// The panel stays out of search results; robots.txt does not name it.
export const metadata: Metadata = { robots: { index: false } };

/**
 * Signed-in area of the admin: only sends strangers to /ingresar. Each area
 * (an organization, the platform) draws its own shell with its own sections.
 * The toaster lives here, once, for the success toasts of every form.
 */
export default async function AdminAppLayout({
  children,
}: LayoutProps<"/panel">) {
  await requireViewer();
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

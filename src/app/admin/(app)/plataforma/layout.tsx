import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/data/viewer";

/** The platform does not exist for anyone but the developer: 404, not 403. */
export default async function PlataformaLayout({
  children,
}: LayoutProps<"/admin/plataforma">) {
  if (!(await requireViewer()).isDeveloper) notFound();
  return children;
}

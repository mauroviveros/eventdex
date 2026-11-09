import { requireOrgOwner } from "@/lib/data/viewer";

/**
 * Owner-only pages. The guard lives above their loading boundary so that a
 * staff member gets a real 404, not a 200 that streams the not-found screen.
 */
export default async function OwnerLayout({
  children,
  params,
}: LayoutProps<"/admin/[org]">) {
  await requireOrgOwner((await params).org);
  return children;
}

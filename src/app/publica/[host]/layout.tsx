import { requireHostOrganization } from "./organization";

/**
 * The public app of one organization. An unknown host (or a suspended org) is
 * a 404 before anything renders; no loading boundary sits above this, so the
 * status is a real 404.
 */
export default async function PublicaLayout({
  children,
  params,
}: LayoutProps<"/publica/[host]">) {
  await requireHostOrganization((await params).host);
  return children;
}

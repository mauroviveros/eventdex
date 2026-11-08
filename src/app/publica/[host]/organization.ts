import { notFound } from "next/navigation";
import { getOrganizationByHost } from "@/lib/data/public";

/**
 * The organization this host serves, or a 404. `host` comes URL-encoded from
 * the proxy's rewrite (it can carry a port: expo.localhost:3000).
 */
export async function requireHostOrganization(encodedHost: string) {
  const host = decodeURIComponent(encodedHost);
  const org = await getOrganizationByHost(host);
  if (!org) notFound();
  return { host, org };
}

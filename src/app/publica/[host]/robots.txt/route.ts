import { publicOrigin } from "@/domain/spots";
import { requireHostOrganization } from "../organization";

/**
 * Per-domain robots: the home and the events are indexable; a QR's medal page
 * (/s/*), the login and the visitor's own pages are not.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/publica/[host]/robots.txt">,
) {
  const { host } = await requireHostOrganization((await params).host);
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /s/",
    "Disallow: /ingresar",
    "Disallow: /mis-medallas",
    "",
    `Sitemap: ${publicOrigin(host)}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

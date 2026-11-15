import { publicOrigin } from "@/domain/spots";
import { requireHostOrganization } from "../organization";

// Next treats a `sitemap.xml` folder as a metadata route and prerenders it
// with a placeholder host; the sitemap depends on the request's host.
export const dynamic = "force-dynamic";

/** Per-domain sitemap: the org has one page, its home. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/publica/[host]/sitemap.xml">,
) {
  const { host } = await requireHostOrganization((await params).host);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${publicOrigin(host)}/</loc></url>\n</urlset>\n`;
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}

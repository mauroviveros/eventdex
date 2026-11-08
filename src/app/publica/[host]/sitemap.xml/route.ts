import { publicOrigin } from "@/domain/spots";
import { listPublicEvents } from "@/lib/data/public";
import { createPublicClient } from "@/lib/supabase/public";
import { requireHostOrganization } from "../organization";

// Next treats a `sitemap.xml` folder as a metadata route and prerenders it
// with a placeholder host; the sitemap depends on the request's host.
export const dynamic = "force-dynamic";

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Per-domain sitemap: the home and every published public event. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/publica/[host]/sitemap.xml">,
) {
  const { host, org } = await requireHostOrganization((await params).host);
  // Public data only: no session needed, the same for every crawler.
  const events = await listPublicEvents(createPublicClient(), org.id);
  const origin = publicOrigin(host);
  const urls = [
    `<url><loc>${escapeXml(origin)}/</loc></url>`,
    ...events.map(
      (e) =>
        `<url><loc>${escapeXml(`${origin}/eventos/${encodeURIComponent(e.slug)}`)}</loc>` +
        `<lastmod>${new Date(e.updated_at ?? e.published_at ?? Date.now()).toISOString()}</lastmod></url>`,
    ),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}

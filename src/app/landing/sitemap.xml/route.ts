import { publicOrigin } from "@/domain/spots";
import { env } from "@/lib/env";

const PATHS = ["/", "/privacidad", "/terminos"];

export function GET() {
  const origin = publicOrigin(env.NEXT_PUBLIC_ROOT_DOMAIN);
  const urls = PATHS.map((path) => `<url><loc>${origin}${path}</loc></url>`);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}

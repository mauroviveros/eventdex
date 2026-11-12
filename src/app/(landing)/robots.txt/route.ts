import { publicOrigin } from "@/domain/spots";
import { env } from "@/lib/env";

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${publicOrigin(env.NEXT_PUBLIC_ROOT_DOMAIN)}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

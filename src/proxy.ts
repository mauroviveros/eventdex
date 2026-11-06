import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { internalPath, surfaceFor } from "@/lib/surface";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? env.NEXT_PUBLIC_ROOT_DOMAIN;
  const surface = surfaceFor(host, env.NEXT_PUBLIC_ROOT_DOMAIN);
  const url = request.nextUrl.clone();
  url.pathname = internalPath(surface, request.nextUrl.pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  // Shared routes (auth, dev) and Next internals are not rewritten; robots and sitemap are per host.
  matcher: ["/((?!_next/|auth/|dev/|favicon.ico).*)"],
};

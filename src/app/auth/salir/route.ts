import { type NextRequest, NextResponse } from "next/server";
import { requestOrigin, safeNext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Signs out and goes to `next` on this host (the panel sends its staff to /ingresar),
 * or to the start of it. POST only, so a link can't log you out.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303: the browser follows with a GET.
  return NextResponse.redirect(
    new URL(
      safeNext(request.nextUrl.searchParams.get("next")),
      requestOrigin(request.headers),
    ),
    303,
  );
}

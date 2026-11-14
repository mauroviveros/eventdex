import { type NextRequest, NextResponse } from "next/server";
import { googleSignInUrl } from "@/lib/auth";
import { requestOrigin, safeNext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Google sign-in as a plain link (`/auth/google?next=/s/…`), for places a form
 * can't go. Same flow as the signInWithGoogle action.
 */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request.headers);
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const url = await googleSignInUrl(await createClient(), origin, next);
  return NextResponse.redirect(new URL(url, origin));
}

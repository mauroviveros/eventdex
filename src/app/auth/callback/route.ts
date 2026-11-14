import { type NextRequest, NextResponse } from "next/server";
import { signInErrorUrl } from "@/lib/auth";
import { requestOrigin, safeNext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** OAuth return: trades the code for a session cookie on this host, then goes to `next`. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = requestOrigin(request.headers);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  // No code (Google cancelled or refused) or an expired one.
  return NextResponse.redirect(new URL(signInErrorUrl(next), origin));
}

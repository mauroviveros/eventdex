import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** OAuth return: trades the code for a session cookie on this host, then goes to `next`. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/ingresar?error=auth", origin));
}

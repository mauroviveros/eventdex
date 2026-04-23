import { type NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url), 303);
  }

  const { supabase, applyCookies } = createRouteClient(request);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return applyCookies(NextResponse.redirect(new URL("/login?error=oauth_callback", request.url), 303));
  }

  return applyCookies(NextResponse.redirect(new URL("/dashboard", request.url), 303));
}

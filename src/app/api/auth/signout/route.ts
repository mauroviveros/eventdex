import { type NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";

async function handleSignOut(request: NextRequest) {
  const { supabase, applyCookies } = createRouteClient(request);
  await supabase.auth.signOut();

  return applyCookies(NextResponse.redirect(new URL("/", request.url), 303));
}

export async function GET(request: NextRequest) {
  return handleSignOut(request);
}

export async function POST(request: NextRequest) {
  return handleSignOut(request);
}

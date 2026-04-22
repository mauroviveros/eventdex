import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "./lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/dashboard")) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

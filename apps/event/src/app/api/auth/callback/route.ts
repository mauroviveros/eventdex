import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { resolveSafeNextPath } from "@/utils";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = resolveSafeNextPath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

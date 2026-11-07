import { type NextRequest, NextResponse } from "next/server";
import { requestOrigin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** Signs out and goes back to the start of this host. POST only, so a link can't log you out. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303: the browser follows with a GET.
  return NextResponse.redirect(
    new URL("/", requestOrigin(request.headers)),
    303,
  );
}

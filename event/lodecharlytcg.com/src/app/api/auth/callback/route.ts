import { createClient } from "@/libs/supabase/server"
import { resolveSafeNextPath } from "@/utils"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = resolveSafeNextPath(url.searchParams.get("next"))

  if (code) {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, url.origin))
}

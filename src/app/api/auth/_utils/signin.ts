import { type NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";

async function resolveProvider(request: NextRequest) {
  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => null)) as { provider?: unknown } | null;
      return typeof body?.provider === "string" ? body.provider : null;
    }

    const formData = await request.formData().catch(() => null);
    const provider = formData?.get("provider");
    return typeof provider === "string" ? provider : null;
  }

  return new URL(request.url).searchParams.get("provider");
}

type handleSignInOptions = Readonly<{
  redirectTo: string;
}>;

export async function handleSignIn(request: NextRequest, options: handleSignInOptions) {
  const provider = await resolveProvider(request);

  if (provider !== "google") {
    return NextResponse.json({ error: "Only the google provider is supported" }, { status: 400 });
  }

  const { supabase, applyCookies } = createRouteClient(request);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: new URL(options.redirectTo, request.url).toString(),
    },
  });

  if (error || !data.url) {
    return NextResponse.json({ error: error?.message ?? "Unable to start Google sign-in" }, { status: 500 });
  }

  return applyCookies(NextResponse.redirect(data.url, 303));
}

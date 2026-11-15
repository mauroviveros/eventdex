import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { type CSSProperties, Suspense } from "react";
import { Logo } from "@/components/pixel/Logo";
import { Monogram } from "@/components/ui/Monogram";
import { MadeWith } from "@/components/visitante/MadeWith";
import { MARQUESINA } from "@/components/visitante/marquesina";
import { SignInLink, VisitorMenu } from "@/components/visitante/VisitorMenu";
import { EVENTDEX_HUE, ramp, rampFromHex, toHex } from "@/domain/palette";
import { logoUrl } from "@/lib/data/organizations";
import { getRaffleHref } from "@/lib/data/standing";
import { getVisitorAccount, getVisitorRole } from "@/lib/data/viewer";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { requireHostOrganization } from "./organization";

export async function generateMetadata({
  params,
}: LayoutProps<"/publica/[host]">): Promise<Metadata> {
  const { org } = await requireHostOrganization((await params).host);
  return { title: { default: org.name, template: `%s · ${org.name}` } };
}

const orgTones = (color: string | null) =>
  color ? rampFromHex(color) : ramp(EVENTDEX_HUE);

/** The browser bar and the overscroll take the org's ground, light and dark. */
export async function generateViewport({
  params,
}: LayoutProps<"/publica/[host]">): Promise<Viewport> {
  const { org } = await requireHostOrganization((await params).host);
  const tones = orgTones(org.brand_color);
  return {
    themeColor: [
      {
        media: "(prefers-color-scheme: light)",
        color: toHex(tones[0] as string),
      },
      {
        media: "(prefers-color-scheme: dark)",
        color: toHex(tones[3] as string),
      },
    ],
  };
}

/**
 * The public app of one organization, painted with its own ramp: the brand
 * leads, Eventdex stays out of sight. An unknown host (or a suspended org) is a
 * 404 before anything renders; no loading boundary sits above this, so the
 * status is a real 404.
 */
export default async function PublicaLayout({
  children,
  params,
}: LayoutProps<"/publica/[host]">) {
  const { org } = await requireHostOrganization((await params).host);
  const tones = orgTones(org.brand_color);
  const style = Object.fromEntries(
    tones.map((tone, i) => [`--ramp-${i}`, tone]),
  ) as CSSProperties;

  // The same ramp on the root: dialogs, menus and the toaster mount on <body>,
  // outside the scope below, and the overscroll shows <html>'s ground.
  const root = `:root{${tones.map((t, i) => `--ramp-${i}:${t}`).join(";")}}html{background:var(--lcd-0)}`;

  return (
    <div
      style={style}
      className={`ramp-scope scanlines min-h-dvh bg-lcd-0 text-lcd-3 ${MARQUESINA}`}
    >
      <style>{root}</style>
      <header
        data-slot="public-header"
        className="sticky top-0 z-30 border-b-2 border-lcd-3 bg-lcd-0"
      >
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-11 min-w-0 items-center gap-3 font-display text-px-2 no-underline"
          >
            {org.logo_path ? (
              <Logo
                src={logoUrl(org.logo_path)}
                mode="lleno"
                label=""
                className="size-10 shrink-0 object-contain"
              />
            ) : (
              <Monogram text={org.name} />
            )}
            <span className="truncate">{org.name}</span>
          </Link>
          <Suspense fallback={<span className="min-h-11" />}>
            <Account org={org} />
          </Suspense>
        </div>
      </header>
      {children}
      <MadeWith />
    </div>
  );
}

/** Who is signed in on this domain, or the way in. Streams after the header. */
async function Account({ org }: { org: { id: string; slug: string } }) {
  const account = await getVisitorAccount();
  if (!account) return <SignInLink />;
  return (
    <VisitorMenu
      account={account}
      raffleHref={await raffleHref(org, account.id)}
    />
  );
}

/** Only the team gets the way to the raffle; if it can't be read the menu is the same without it. */
async function raffleHref(org: { id: string; slug: string }, userId: string) {
  try {
    const role = await getVisitorRole(org.id, userId);
    if (!role) return undefined;
    const href = await getRaffleHref(
      await createClient(),
      org,
      env.NEXT_PUBLIC_ROOT_DOMAIN,
    );
    return href ?? undefined;
  } catch (error) {
    console.error("public layout: raffle link", error);
    return undefined;
  }
}

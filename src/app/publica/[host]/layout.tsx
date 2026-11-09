import type { Metadata } from "next";
import Link from "next/link";
import { type CSSProperties, Suspense } from "react";
import { LcdFilters } from "@/components/pixel/LcdFilters";
import { Monogram } from "@/components/ui/Monogram";
import { Logo } from "@/components/visitante/Medal";
import { SignInLink, VisitorMenu } from "@/components/visitante/VisitorMenu";
import { EVENTDEX_HUE, ramp, rampFromHex } from "@/domain/palette";
import { logoUrl } from "@/lib/data/organizations";
import { getVisitorAccount } from "@/lib/data/viewer";
import { requireHostOrganization } from "./organization";

export async function generateMetadata({
  params,
}: LayoutProps<"/publica/[host]">): Promise<Metadata> {
  const { org } = await requireHostOrganization((await params).host);
  return { title: { default: org.name, template: `%s · ${org.name}` } };
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
  const tones = org.brand_color
    ? rampFromHex(org.brand_color)
    : ramp(EVENTDEX_HUE);
  const style = Object.fromEntries(
    tones.map((tone, i) => [`--ramp-${i}`, tone]),
  ) as CSSProperties;

  return (
    <div
      style={style}
      className="ramp-scope scanlines min-h-dvh bg-lcd-0 text-lcd-3"
    >
      <LcdFilters ramp={tones} />
      <header className="border-b-2 border-lcd-3">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
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
            <Account />
          </Suspense>
        </div>
      </header>
      {children}
    </div>
  );
}

/** Who is signed in on this domain, or the way in. Streams after the header. */
async function Account() {
  const account = await getVisitorAccount();
  return account ? <VisitorMenu account={account} /> : <SignInLink />;
}

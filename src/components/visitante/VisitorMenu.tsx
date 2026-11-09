"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Chevron } from "@/components/pixel/Chevron";
import { GoogleSignIn } from "@/components/ui/GoogleSignIn";
import { Monogram } from "@/components/ui/Monogram";

type Account = {
  name: string;
  email: string;
  /** Google's photo, when the account has one. */
  avatarUrl: string | null;
};

/**
 * The visitor's account in the public header: photo, name and mail, and a menu
 * with their medals and sign-out. A <details>, so it works before any JS. On
 * phones only the photo shows; the name moves into the menu.
 */
export function VisitorMenu({ account }: { account: Account }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  return (
    <details
      // The header outlives navigation: a new page remounts the menu closed.
      key={pathname}
      ref={ref}
      className="group relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && ref.current?.open) {
          ref.current.open = false;
          ref.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 border-2 border-transparent px-2 py-1 hover:border-lcd-3 group-open:border-lcd-3 group-open:bg-lcd-1 [&::-webkit-details-marker]:hidden">
        <Avatar account={account} />
        <span className="hidden min-w-0 max-w-48 text-left sm:grid">
          <span className="truncate font-display text-px-1">
            {account.name}
          </span>
          {account.name !== account.email && (
            <span className="truncate text-sm text-muted-foreground">
              {account.email}
            </span>
          )}
        </span>
        <Chevron className="group-open:rotate-180" />
        <span className="sr-only">Tu cuenta</span>
      </summary>
      <div className="absolute top-full right-0 z-20 mt-1 grid w-64 border-2 border-lcd-3 bg-plate shadow-plate">
        <p className="grid border-b-2 border-lcd-3 px-3 py-2 sm:hidden">
          <span className="truncate font-display text-px-1">
            {account.name}
          </span>
          {account.name !== account.email && (
            <span className="truncate text-sm">{account.email}</span>
          )}
        </p>
        <Link
          href="/mis-medallas"
          className="flex min-h-11 items-center px-3 font-display text-px-1 no-underline hover:bg-lcd-1"
        >
          Mis medallas
        </Link>
        <form
          action="/auth/salir"
          method="post"
          className="border-t-2 border-lcd-3"
        >
          <button
            type="submit"
            className="flex min-h-11 w-full items-center px-3 font-display text-px-1 text-danger hover:bg-lcd-1"
          >
            Salir
          </button>
        </form>
      </div>
    </details>
  );
}

function Avatar({ account }: { account: Account }) {
  if (!account.avatarUrl) return <Monogram text={account.name} size="sm" />;
  return (
    // biome-ignore lint/performance/noImgElement: a 32 px external photo; next/image would need every provider's host in the config
    <img
      src={account.avatarUrl}
      alt=""
      width={32}
      height={32}
      referrerPolicy="no-referrer"
      className="size-8 shrink-0 border-2 border-lcd-3 object-cover"
    />
  );
}

/**
 * Signed out: the way to sign in, coming back to this page. Reads the
 * path on the client, so it follows navigation the server header doesn't see.
 */
export function SignInLink() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  if (pathname.startsWith("/ingresar")) return null;
  const next = query ? `${pathname}?${query}` : pathname;
  // Production only has Google, so straight to it; /ingresar also offers the mail link.
  if (process.env.NODE_ENV === "production") {
    return (
      <GoogleSignIn
        next={next}
        variant="secondary"
        className="whitespace-nowrap"
      >
        Ingresar
      </GoogleSignIn>
    );
  }
  return (
    <Link
      href={`/ingresar?next=${encodeURIComponent(next)}`}
      className="flex min-h-11 items-center border-2 border-lcd-3 bg-plate px-3 font-display text-px-1 no-underline shadow-plate hover:bg-lcd-1 active:translate-y-0.5 active:shadow-none"
    >
      Ingresar
    </Link>
  );
}

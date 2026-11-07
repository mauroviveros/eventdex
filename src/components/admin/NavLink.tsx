"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * A section in the admin rail. The current one reads as an inverted LCD cell
 * (ink block, ground text) and carries aria-current.
 */
export function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: ReactNode;
  /** Only the exact path is current (for "/", which prefixes everything). */
  exact?: boolean;
}) {
  // Internal paths carry the surface prefix (/admin); links don't.
  const path = usePathname().replace(/^\/admin(?=\/|$)/, "") || "/";
  const current = exact ? path === href : path.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className="flex min-h-11 shrink-0 items-center border-2 border-transparent px-3 font-display text-px-1 whitespace-nowrap no-underline hover:border-lcd-3 aria-[current=page]:bg-lcd-3 aria-[current=page]:text-lcd-0"
    >
      {children}
    </Link>
  );
}

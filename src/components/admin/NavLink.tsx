"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Header link that marks the current section for sight and for screen readers. */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // The admin's internal paths carry the surface prefix; the links don't.
  const path = pathname.replace(/^\/admin(?=\/|$)/, "") || "/";
  const current = href === "/" ? path === "/" : path.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className="flex min-h-11 items-center font-display text-px-1 no-underline decoration-2 underline-offset-4 hover:underline aria-[current=page]:underline"
    >
      {children}
    </Link>
  );
}

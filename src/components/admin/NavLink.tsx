"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type IconName, PixelIcon } from "@/components/pixel/icons";
import { SidebarMenuButton, useSidebar } from "@/components/ui/shadcn/sidebar";

/**
 * A section in the admin sidebar. The current one reads as an inverted LCD
 * cell and carries aria-current. Collapsed, only its icon shows, with the
 * label as a tooltip.
 */
export function NavLink({
  href,
  label,
  icon,
  exact = false,
  also,
}: {
  href: string;
  label: string;
  icon: IconName;
  /** Only the exact path is current (for "/", which prefixes everything). */
  exact?: boolean;
  /** Another path prefix that also makes it current. */
  also?: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  // Internal paths carry the surface prefix (/admin); links don't.
  const path = usePathname().replace(/^\/admin(?=\/|$)/, "") || "/";
  const current =
    (exact ? path === href : path.startsWith(href)) ||
    (also !== undefined && path.startsWith(also));
  return (
    <SidebarMenuButton asChild isActive={current} tooltip={label}>
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        onClick={() => isMobile && setOpenMobile(false)}
      >
        <PixelIcon name={icon} />
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  );
}

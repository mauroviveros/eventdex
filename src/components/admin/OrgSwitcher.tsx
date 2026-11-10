"use client";

import Link from "next/link";
import { Chevron } from "@/components/pixel/Chevron";
import { Monogram } from "@/components/ui/Monogram";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/shadcn/sidebar";

type Org = { slug: string; name: string; role?: "owner" | "staff" };

const ROLE = { owner: "Owner", staff: "Staff" } as const;

/** Hidden while the sidebar is collapsed to icons. */
const EXPANDED_ONLY = "group-data-[collapsible=icon]:hidden";

/**
 * The organization you are in, at the top of the sidebar. With more than one,
 * it opens a menu with all of them to switch.
 */
export function OrgSwitcher({ current, all }: { current: Org; all: Org[] }) {
  const { isMobile } = useSidebar();
  const head = (
    <>
      <Monogram text={current.name} />
      <span className={`grid min-w-0 flex-1 text-left ${EXPANDED_ONLY}`}>
        <span className="truncate font-display text-px-1">{current.name}</span>
        {current.role && (
          <span className="text-sm text-muted-foreground">
            {ROLE[current.role]}
          </span>
        )}
      </span>
    </>
  );

  if (!all.some((o) => o.slug !== current.slug)) {
    return (
      <div className="flex min-h-14 items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        {head}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="px-1">
          {head}
          <Chevron className={EXPANDED_ONLY} />
          <span className="sr-only">Cambiar de organización</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-64"
      >
        <DropdownMenuLabel>Organizaciones</DropdownMenuLabel>
        <DropdownMenuGroup>
          {all.map((org) => (
            <DropdownMenuItem key={org.slug} asChild>
              <Link
                href={`/${org.slug}`}
                aria-current={org.slug === current.slug ? "page" : undefined}
              >
                <Monogram text={org.name} size="sm" />
                <span className="min-w-0 flex-1 truncate">{org.name}</span>
                {org.slug === current.slug && (
                  <span className="font-sans text-sm text-muted-foreground">
                    actual
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

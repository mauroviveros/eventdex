import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import type { IconName } from "@/components/pixel/icons";
import { Monogram } from "@/components/ui/Monogram";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/shadcn/sidebar";
import { type Account, AccountMenu } from "./AccountMenu";
import { NavLink } from "./NavLink";
import { OrgSwitcher } from "./OrgSwitcher";

export type Section = {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  /** Another path prefix that also makes this section current (its subpages). */
  also?: string;
};

type Props = {
  account: Account;
  /** The sidebar's sections, in order. The current one is highlighted. */
  sections: Section[];
  /** A state that applies to the whole area (support mode), over every page. */
  notice?: ReactNode;
  /** The organization being worked on. Without one, the sidebar shows the brand. */
  org?: {
    current: { slug: string; name: string; role?: "owner" | "staff" };
    all: { slug: string; name: string }[];
  };
  children: ReactNode;
};

/**
 * Frame of the admin and the platform: a sidebar with the organization, the
 * sections and the account, that collapses to icons; the page (with its
 * TopBar, which carries the toggle) on the right. On phones the sidebar is a
 * sheet that the TopBar's toggle opens.
 */
export async function AdminShell({
  account,
  sections,
  notice,
  org,
  children,
}: Props) {
  // Same name as SIDEBAR_COOKIE_NAME in sidebar.tsx (a client module's
  // constants don't reach the server). Collapsed survives a reload.
  const open = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={open}>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:bg-lcd-3 focus:px-3 focus:py-2 focus:text-lcd-0"
      >
        Ir al contenido
      </a>

      <Sidebar>
        <SidebarHeader>
          {org ? (
            <OrgSwitcher current={org.current} all={org.all} />
          ) : (
            <SidebarMenuButton asChild size="lg" className="px-1">
              <Link href="/panel">
                <Monogram text="Eventdex" />
                <span className="font-display text-px-2">Eventdex</span>
              </Link>
            </SidebarMenuButton>
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <nav aria-label="Secciones">
              <SidebarMenu>
                {sections.map((section) => (
                  <SidebarMenuItem key={section.href}>
                    <NavLink {...section} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <AccountMenu account={account} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset id="contenido">
        {notice}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

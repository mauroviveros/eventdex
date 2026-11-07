import Link from "next/link";
import type { ReactNode } from "react";
import { AccountMenu } from "./AccountMenu";
import { NavLink } from "./NavLink";
import { OrgSwitcher } from "./OrgSwitcher";

export type Section = {
  href: string;
  label: string;
  exact?: boolean;
  /** Another path prefix that also makes this section current (its subpages). */
  also?: string;
};

type Props = {
  email: string | null;
  /** The rail's sections, in order. The current one is highlighted. */
  sections: Section[];
  /** A state that applies to the whole area (support mode), under the org in the rail. */
  notice?: ReactNode;
  /** The organization being worked on. Without one, the rail shows the brand. */
  org?: {
    current: { slug: string; name: string; role?: "owner" | "staff" };
    all: { slug: string; name: string }[];
  };
  children: ReactNode;
};

/**
 * Frame of the admin and the platform: a rail with the organization, the
 * sections and the account; the page (with its TopBar) on the right.
 * On phones the rail becomes a block on top, sections in a scrolling row.
 */
export function AdminShell({ email, sections, notice, org, children }: Props) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr] print:block">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:bg-lcd-3 focus:px-3 focus:py-2 focus:text-lcd-0"
      >
        Ir al contenido
      </a>

      <aside className="flex flex-col print:hidden border-b-2 border-lcd-3 lg:sticky lg:top-0 lg:h-dvh lg:border-r-2 lg:border-b-0">
        <div className="flex items-center border-b-2 border-lcd-3">
          <div className="min-w-0 flex-1">
            {org ? (
              <OrgSwitcher current={org.current} all={org.all} />
            ) : (
              <Link
                href="/"
                className="flex min-h-16 items-center gap-3 px-3 font-display text-px-2 no-underline"
              >
                Eventdex
              </Link>
            )}
          </div>
          <div className="lg:hidden">
            <AccountMenu email={email} compact />
          </div>
        </div>

        {notice}

        <nav
          aria-label="Secciones"
          className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible"
        >
          {sections.map((section) => (
            <NavLink
              key={section.href}
              href={section.href}
              exact={section.exact}
              also={section.also}
            >
              {section.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden border-t-2 border-lcd-3 lg:block">
          <AccountMenu email={email} />
        </div>
      </aside>

      <div id="contenido" className="min-w-0">
        {children}
      </div>
    </div>
  );
}

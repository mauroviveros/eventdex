import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/shadcn/breadcrumb";
import { SidebarTrigger } from "@/components/ui/shadcn/sidebar";

/**
 * The top of every admin page: the sidebar's toggle and where you are on the
 * left, the screen's actions on the right. Sticky, so the actions are always
 * at hand. On a section page the title is the page's h1. A page under another
 * one passes `crumbs`, the way back up, and keeps its own h1: the title
 * becomes the last step of the path. Lives inside PanelShell (the toggle
 * needs its sidebar).
 */
export function TopBar({
  title,
  crumbs,
  actions,
}: {
  title: string;
  crumbs?: { label: string; href: string }[];
  actions?: ReactNode;
}) {
  return (
    <header
      data-slot="topbar"
      className="sticky top-0 z-10 border-b-2 border-lcd-3 bg-lcd-0 print:hidden"
    >
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        {/* A section's title never truncates: a long action wraps below it instead. */}
        <div
          className={`flex flex-1 items-center gap-2 ${crumbs?.length ? "min-w-0" : "min-w-fit"}`}
        >
          <SidebarTrigger className="-ml-2" />
          {crumbs?.length ? (
            <Breadcrumb className="min-w-0">
              <BreadcrumbList>
                {crumbs.map((c, i) => {
                  // On a phone only the step right above shows, as a way back:
                  // the page's own h1 already says where you are.
                  const parent = i === crumbs.length - 1;
                  return (
                    <Fragment key={c.href}>
                      {parent && (
                        <BreadcrumbSeparator className="rotate-180 sm:hidden" />
                      )}
                      <BreadcrumbItem className={parent ? "" : "max-sm:hidden"}>
                        <BreadcrumbLink asChild>
                          <Link href={c.href}>{c.label}</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="max-sm:hidden" />
                    </Fragment>
                  );
                })}
                <BreadcrumbItem className="max-sm:sr-only">
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            // A section page has no other title: the bar's is its h1.
            <h1 className="font-display text-px-2">{title}</h1>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Content column under the TopBar. */
export function PageBody({ children }: { children: ReactNode }) {
  return (
    <main className="grid grid-cols-1 gap-8 px-4 py-8 sm:px-6 print:p-0">
      {children}
    </main>
  );
}

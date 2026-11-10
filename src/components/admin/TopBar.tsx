import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/shadcn/sidebar";

/**
 * The top of every admin page: the sidebar's toggle and where you are on the
 * left, the screen's one primary action on the right. Sticky, so the action
 * is always at hand. Lives inside AdminShell (the toggle needs its sidebar).
 */
export function TopBar({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b-2 border-lcd-3 bg-lcd-0 print:hidden">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-2" />
          <p className="font-display text-px-2">{title}</p>
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

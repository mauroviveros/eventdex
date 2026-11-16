"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useOptimistic, useTransition } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn/tabs";
import type { EventTab } from "./query";

const LABEL: Record<EventTab, string> = {
  resumen: "Resumen",
  general: "General",
  pagina: "Página",
  spots: "Spots",
  visitantes: "Visitantes",
  sorteo: "Sorteo",
};

/**
 * The event's tabs. The active one lives in the URL (?tab=…), so the server
 * reads only what it shows and a reload or a shared link lands on it. The
 * strip switches at once; the panel keeps the previous content, dimmed, until
 * the new one arrives.
 */
export function EventTabs({
  tabs,
  home,
  value,
  counts,
  children,
}: {
  /** The tabs this event has: a draft has no Resumen. */
  tabs: readonly EventTab[];
  /** The tab the bare URL opens, so it needs no ?tab=. */
  home: EventTab;
  value: EventTab;
  counts: Partial<Record<EventTab, number>>;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(value);

  return (
    <Tabs
      value={shown}
      // Arrows move between tabs; Enter or Space opens one (each is a navigation).
      activationMode="manual"
      onValueChange={(next) =>
        startTransition(() => {
          setShown(next as EventTab);
          // A new tab starts on its first page, in its default order.
          router.push(next === home ? pathname : `${pathname}?tab=${next}`, {
            scroll: false,
          });
        })
      }
    >
      <TabsList
        aria-label="Secciones del evento"
        // On a phone the six take two rows of three, the count under the name: no scrolling to find one.
        className="max-sm:grid max-sm:h-auto max-sm:w-full max-sm:grid-cols-3"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab}
            id={`pestana-${tab}`}
            value={tab}
            // In the phone's grid, the row's last cell leaves the right rule to the frame and the second row gets a rule on top.
            className="max-sm:flex-col max-sm:justify-center max-sm:gap-0 max-sm:px-1 max-sm:py-1 max-sm:nth-[3n]:border-r-0 max-sm:nth-[n+4]:border-t-2"
          >
            {LABEL[tab]}
            {/* Read as "Spots 4", not "Spots4"; the flex gap does the visual spacing. */}
            {counts[tab] !== undefined && " "}
            {counts[tab] !== undefined && (
              <span className="tabular-nums opacity-80">
                {counts[tab].toLocaleString("es-AR")}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent
        value={shown}
        // Named by the tab it still shows, not the one on its way.
        aria-labelledby={`pestana-${value}`}
        aria-busy={pending || undefined}
        className={pending ? "opacity-60" : undefined}
      >
        {children}
      </TabsContent>
    </Tabs>
  );
}

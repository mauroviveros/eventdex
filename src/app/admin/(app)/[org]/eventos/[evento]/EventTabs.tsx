"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useOptimistic, useTransition } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn/tabs";
import { EVENT_TABS, type EventTab } from "./query";

const LABEL: Record<EventTab, string> = {
  general: "General",
  spots: "Spots",
  visitantes: "Visitantes",
};

/**
 * The event's tabs. The active one lives in the URL (?tab=…), so the server
 * reads only what it shows and a reload or a shared link lands on it. The
 * strip switches at once; the panel keeps the previous content, dimmed, until
 * the new one arrives.
 */
export function EventTabs({
  value,
  counts,
  children,
}: {
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
          router.push(
            next === "general" ? pathname : `${pathname}?tab=${next}`,
            {
              scroll: false,
            },
          );
        })
      }
    >
      <TabsList aria-label="Secciones del evento">
        {EVENT_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {LABEL[tab]}
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
        aria-busy={pending || undefined}
        className={pending ? "opacity-60" : undefined}
      >
        {children}
      </TabsContent>
    </Tabs>
  );
}

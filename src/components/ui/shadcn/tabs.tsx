"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

// shadcn/ui tabs on the LCD: the segmented strip of the event filters (2 px
// rule, ink fill on the active one, pixel face, 44 px tall), no radius, shadow
// or animation. Only the horizontal orientation is drawn.

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("grid gap-8", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex w-fit max-w-full overflow-x-auto border-2 border-lcd-3",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "flex min-h-11 shrink-0 cursor-pointer items-center gap-2 border-r-2 border-lcd-3 px-4 font-display text-px-1 whitespace-nowrap last:border-r-0 hover:bg-lcd-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-lcd-3 data-[state=active]:text-lcd-0",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("grid gap-10", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };

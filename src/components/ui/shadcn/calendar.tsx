"use client";

import type * as React from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { Chevron } from "@/components/pixel/Chevron";
import { cn } from "@/lib/utils";

// shadcn/ui calendar (react-day-picker) on the LCD: in Spanish, weeks from
// Monday, 44 px days in the pixel face, the chosen day an inverted cell and
// today underlined. Month and year are dropdowns, to jump far without paging.

/** The pixel chevron (it points down), turned to where the month goes. */
function CalendarChevron({
  orientation,
}: {
  orientation?: "up" | "down" | "left" | "right";
}) {
  const turn = { left: "rotate-90", right: "-rotate-90", up: "rotate-180" };
  return (
    <Chevron
      className={orientation && orientation !== "down" ? turn[orientation] : ""}
    />
  );
}

const CELL = "grid size-11 place-items-center border-2 border-transparent";

function Calendar({
  className,
  classNames,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={es}
      captionLayout="dropdown"
      showOutsideDays
      className={cn("p-2", className)}
      classNames={{
        months: "relative",
        month: "grid gap-2",
        nav: "absolute inset-x-0 top-0 flex justify-between",
        button_previous: cn(CELL, "hover:border-border disabled:opacity-50"),
        button_next: cn(CELL, "hover:border-border disabled:opacity-50"),
        month_caption: "flex h-11 items-center justify-center px-11",
        dropdowns: "flex items-center gap-1",
        dropdown_root:
          "relative flex min-h-9 items-center border-2 border-input has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground",
        dropdown: "absolute inset-0 cursor-pointer opacity-0",
        caption_label:
          "flex items-center gap-1 px-2 font-display text-px-1 capitalize",
        month_grid: "border-collapse",
        weekdays: "flex",
        weekday:
          "grid size-11 place-items-center text-sm font-normal text-muted-foreground",
        week: "flex",
        day: "p-0",
        day_button: cn(CELL, "font-display text-px-1 hover:border-border"),
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground",
        today:
          "[&>button]:underline [&>button]:decoration-2 [&>button]:underline-offset-4",
        outside: "text-muted-foreground",
        disabled: "opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{ Chevron: CalendarChevron }}
      {...props}
    />
  );
}

export { Calendar };

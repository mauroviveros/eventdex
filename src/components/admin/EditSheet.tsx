"use client";

import type { ReactNode } from "react";
import { buttonClass, type Variant } from "@/components/ui/Button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/shadcn/sheet";

/**
 * A button that opens a side sheet with forms: how the panel edits something
 * without leaving the page. The sheet scrolls on its own; Cerrar, Escape or
 * the overlay close it, and the focus goes back to the button.
 */
export function EditSheet({
  label,
  title,
  description,
  variant = "secondary",
  ariaLabel,
  children,
}: {
  label: string;
  title: string;
  description: string;
  variant?: Variant;
  /** Accessible name when the button needs context ("Editar Expo 2026"). */
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger className={buttonClass(variant)} aria-label={ariaLabel}>
        {label}
      </SheetTrigger>
      <SheetContent className="w-full gap-8 overflow-y-auto p-6 sm:max-w-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <SheetTitle className="text-px-2">{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </div>
          <SheetClose className={buttonClass("secondary")}>Cerrar</SheetClose>
        </div>
        {children}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
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
 * the overlay close it, and the focus goes back to the button. If the button
 * is gone (what it edited was removed from the sheet), the focus goes to
 * `fallbackFocus` instead of the top of the page.
 */
export function EditSheet({
  label,
  title,
  description,
  variant = "secondary",
  ariaLabel,
  fallbackFocus,
  openParam,
  children,
}: {
  label: string;
  title: string;
  description: string;
  variant?: Variant;
  /** Accessible name when the button needs context ("Editar Expo 2026"). */
  ariaLabel?: string;
  /** Id of what takes the focus if the button no longer exists on close. */
  fallbackFocus?: string;
  /**
   * A URL param that opens the sheet (?nuevo), on load or from a link. It
   * leaves the URL once open, so a reload or a shared link doesn't reopen it.
   */
  openParam?: string;
  children: ReactNode;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const params = useSearchParams();
  const pathname = usePathname();
  useEffect(() => {
    if (!openParam || !params.has(openParam)) return;
    setOpen(true);
    const next = new URLSearchParams(params);
    next.delete(openParam);
    // Next keeps its router in step with replaceState, without a new render.
    window.history.replaceState(
      null,
      "",
      next.size ? `${pathname}?${next}` : pathname,
    );
  }, [openParam, params, pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        ref={trigger}
        className={buttonClass(variant)}
        aria-label={ariaLabel}
      >
        {label}
      </SheetTrigger>
      <SheetContent
        className="w-full gap-8 overflow-y-auto p-6 sm:max-w-lg"
        onCloseAutoFocus={(e) => {
          if (!fallbackFocus || trigger.current?.isConnected) return;
          e.preventDefault();
          document.getElementById(fallbackFocus)?.focus();
        }}
      >
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

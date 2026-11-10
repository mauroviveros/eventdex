"use client";

import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type * as React from "react";
import { PixelIcon } from "@/components/pixel/icons";
import { cn } from "@/lib/utils";

// shadcn/ui checkbox on the LCD: a 20 px ink square that fills when checked.
// Inside a form with a name it posts "on", like a native one. Wrap it in a
// Label with its text so the whole row is the 44 px target.

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer grid size-5 shrink-0 place-items-center border-2 border-input bg-background text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator">
        <PixelIcon name="check" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };

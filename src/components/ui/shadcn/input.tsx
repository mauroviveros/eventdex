import type * as React from "react";
import { cn } from "@/lib/utils";

// shadcn/ui input on the LCD: 44 px, 2 px ink rule, square, danger rule when
// invalid. Focus is the global outline. The same look as NativeSelect.
export const CONTROL =
  "min-h-11 w-full min-w-0 border-2 border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground aria-invalid:border-danger disabled:cursor-not-allowed disabled:border-muted-foreground disabled:bg-muted disabled:text-muted-foreground";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        CONTROL,
        "file:my-1 file:mr-3 file:border-2 file:border-input file:bg-background file:px-3 file:py-0.5 file:font-display file:text-px-1 file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

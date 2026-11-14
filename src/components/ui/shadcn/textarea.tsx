import type * as React from "react";
import { cn } from "@/lib/utils";
import { CONTROL } from "./input";

// shadcn/ui textarea on the LCD: the same control as Input, taller, with the
// text kept off the rule.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(CONTROL, "min-h-32 py-2", className)}
      {...props}
    />
  );
}

export { Textarea };

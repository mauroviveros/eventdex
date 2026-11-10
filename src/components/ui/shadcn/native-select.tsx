import type * as React from "react";
import { Chevron } from "@/components/pixel/Chevron";
import { cn } from "@/lib/utils";
import { CONTROL } from "./input";

// shadcn/ui native-select: the system's own picker (the comfortable one on a
// phone), drawn like Input with a pixel chevron. Options take the system's
// colors, which follow color-scheme.

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div
      className="relative w-full has-[select:disabled]:opacity-50"
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        className={cn(CONTROL, "appearance-none pr-10", className)}
        {...props}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
        <Chevron />
      </span>
    </div>
  );
}

export { NativeSelect };

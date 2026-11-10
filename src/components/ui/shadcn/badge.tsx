import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

// shadcn/ui badge on the LCD: a square tag in the pixel face with a 2 px rule.
// The variants are the four tones plus danger; a dashed rule (draft, no date)
// goes in className.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 border-2 px-2 py-0.5 font-display text-px-1 whitespace-nowrap",
  {
    variants: {
      variant: {
        /** Ink: what is happening now. */
        default: "border-primary bg-primary text-primary-foreground",
        /** Fill: something that comes next. */
        secondary: "border-border bg-accent text-accent-foreground",
        /** Rule only. */
        outline: "border-border text-foreground",
        /** Secondary tone: done, or not active. */
        muted: "border-muted-foreground text-muted-foreground",
        /** Only for something wrong. */
        destructive: "border-danger text-danger",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge };

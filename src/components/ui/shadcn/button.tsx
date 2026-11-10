import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

// shadcn/ui button on the LCD: 44 px, pixel face, 2 px rule and the plate's
// hard shadow, which it drops when pressed. Focus is the global outline.
const buttonVariants = cva(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border-2 px-4 font-display text-px-1 whitespace-nowrap no-underline shadow-plate transition-colors duration-100 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:border-muted-foreground disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground hover:border-muted-foreground hover:bg-muted-foreground",
        secondary: "border-border bg-plate text-foreground hover:bg-accent",
        destructive:
          "border-danger bg-danger text-danger-foreground hover:border-primary hover:bg-primary",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Button({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };

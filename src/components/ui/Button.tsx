import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants, Button as ShadcnButton } from "./shadcn/button";

export type Variant = "primary" | "secondary" | "danger";

// Our names for shadcn's variants.
const VARIANT = {
  primary: "default",
  secondary: "secondary",
  danger: "destructive",
} as const;

/** Button look for anything that acts like one (a Link to a form, for instance). */
export function buttonClass(variant: Variant = "primary", className = "") {
  return cn(buttonVariants({ variant: VARIANT[variant] }), className);
}

type Props = ComponentProps<"button"> & {
  variant?: Variant;
  /** Shown instead of the label while the action runs ("Publicando…"). */
  pendingLabel?: string;
  pending?: boolean;
};

/** shadcn's Button with our variant names and a pending state ("Publicando…"). */
export function Button({
  variant = "primary",
  pending = false,
  pendingLabel,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: Props) {
  return (
    <ShadcnButton
      type={type}
      variant={VARIANT[variant]}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={className}
      {...props}
    >
      {pending && <PendingBlocks />}
      {pending && pendingLabel ? pendingLabel : children}
    </ShadcnButton>
  );
}

/** Three blocks that light up in turn, like a handheld loading bar. */
function PendingBlocks() {
  return (
    <span aria-hidden className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-blink bg-current"
          style={{ animationDelay: `${i * 333}ms` }}
        />
      ))}
    </span>
  );
}

import type { ComponentProps } from "react";

export type Variant = "primary" | "secondary" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "border-lcd-3 bg-lcd-3 text-lcd-0 hover:border-lcd-2 hover:bg-lcd-2",
  secondary: "border-lcd-3 bg-lcd-0 text-lcd-3 hover:bg-lcd-1",
  danger:
    "border-danger bg-danger text-danger-foreground hover:bg-lcd-3 hover:border-lcd-3",
};

/** Button look for anything that acts like one (a Link to a form, for instance). */
export function buttonClass(variant: Variant = "primary", className = "") {
  return `inline-flex min-h-11 items-center justify-center gap-2 border-2 px-4 font-display text-px-1 transition-colors duration-100 active:translate-y-0.5 disabled:cursor-not-allowed disabled:border-lcd-2 disabled:bg-lcd-1 disabled:text-lcd-2 ${VARIANTS[variant]} ${className}`;
}

type Props = ComponentProps<"button"> & {
  variant?: Variant;
  /** Shown instead of the label while the action runs ("Publicando…"). */
  pendingLabel?: string;
  pending?: boolean;
};

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
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonClass(variant, className)}
      {...props}
    >
      {pending && <PendingBlocks />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
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

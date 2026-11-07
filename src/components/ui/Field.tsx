import { type ComponentProps, useId } from "react";
import { AlertIcon } from "@/components/pixel/AlertIcon";

type Props = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({ label, hint, error, className = "", ...props }: Props) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-display text-px-1">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="min-h-11 border-2 border-lcd-3 bg-lcd-0 px-3 text-base text-lcd-3 placeholder:text-lcd-2 aria-invalid:border-danger disabled:border-lcd-2 disabled:bg-lcd-1 disabled:text-lcd-2"
        {...props}
      />
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-start gap-2 text-sm text-danger"
        >
          <span className="mt-0.5">
            <AlertIcon />
          </span>
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

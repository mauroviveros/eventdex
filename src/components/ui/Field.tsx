import { type ComponentProps, type ReactNode, useId } from "react";
import { AlertIcon } from "@/components/pixel/AlertIcon";

type Labels = {
  label: string;
  hint?: string;
  error?: string;
};

const CONTROL =
  "min-h-11 w-full min-w-0 border-2 border-lcd-3 bg-lcd-0 px-3 text-base text-lcd-3 placeholder:text-lcd-2 aria-invalid:border-danger disabled:border-lcd-2 disabled:bg-lcd-1 disabled:text-lcd-2 file:my-1 file:mr-3 file:border-2 file:border-lcd-3 file:bg-lcd-0 file:px-3 file:py-0.5 file:font-display file:text-px-1 file:text-lcd-3";

/** Label, control and either its error or its hint, wired for screen readers. */
function FieldFrame({
  label,
  hint,
  error,
  className,
  control,
}: Labels & {
  className: string;
  control: (a11y: {
    id: string;
    "aria-invalid"?: true;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`grid content-start gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-display text-px-1">
        {label}
      </label>
      {control({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
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

export function Field({
  label,
  hint,
  error,
  className = "",
  ...props
}: ComponentProps<"input"> & Labels) {
  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      className={className}
      control={(a11y) => <input className={CONTROL} {...a11y} {...props} />}
    />
  );
}

/** A native select with the same frame as Field. */
export function SelectField({
  label,
  hint,
  error,
  className = "",
  children,
  ...props
}: ComponentProps<"select"> & Labels) {
  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      className={className}
      control={(a11y) => (
        // React applies a select's defaultValue only on mount, and a form
        // reset goes back to it: remount when it changes (values kept after
        // a failed submit).
        <select
          key={
            props.defaultValue === undefined
              ? undefined
              : String(props.defaultValue)
          }
          className={CONTROL}
          {...a11y}
          {...props}
        >
          {children}
        </select>
      )}
    />
  );
}

/** A form's own outcome, above its fields: an error to fix, or what just got saved. */
export function FormMessage({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return tone === "error" ? (
    <p role="alert" className="flex items-start gap-2 text-danger">
      <span className="mt-1">
        <AlertIcon />
      </span>
      {children}
    </p>
  ) : (
    <p role="status" className="border-2 border-lcd-3 bg-lcd-1 px-4 py-3">
      {children}
    </p>
  );
}

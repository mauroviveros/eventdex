import { type ComponentProps, type ReactNode, useId } from "react";
import { AlertIcon } from "@/components/pixel/AlertIcon";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { NativeSelect } from "@/components/ui/shadcn/native-select";

type Labels = {
  label: string;
  hint?: string;
  error?: string;
};

/** Label, control and either its error or its hint, wired for screen readers. */
export function FieldFrame({
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
      <Label htmlFor={id}>{label}</Label>
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
      control={(a11y) => <Input {...a11y} {...props} />}
    />
  );
}

/** A native select (shadcn NativeSelect) with the same frame as Field. */
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
        <NativeSelect
          key={
            props.defaultValue === undefined
              ? undefined
              : String(props.defaultValue)
          }
          {...a11y}
          {...props}
        >
          {children}
        </NativeSelect>
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

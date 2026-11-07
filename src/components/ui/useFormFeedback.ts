import { useEffect, useRef } from "react";

type Failed = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
  values: Record<string, string>;
};

/**
 * What a form needs from its action state: the failure (if any), its field
 * errors, the values to put back, and focus on the first field to fix.
 */
export function useFormFeedback(state: Failed | { ok: true } | null) {
  const form = useRef<HTMLFormElement>(null);
  const failed = state && !state.ok ? state : null;

  useEffect(() => {
    if (failed)
      form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [failed]);

  return {
    form,
    failed,
    fields: failed?.fieldErrors ?? {},
    values: failed?.values ?? {},
  };
}

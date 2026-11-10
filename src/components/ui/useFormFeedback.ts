import { useEffect, useRef } from "react";
import { toast } from "sonner";

type Failed = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
  values: Record<string, string>;
};

/**
 * What a form needs from its action state: the failure (if any), its field
 * errors, the values to put back, and focus on the first field to fix. With
 * `saved`, a success shows it as a toast (each response is a new state, so
 * saving twice shows it twice).
 */
export function useFormFeedback(
  state: Failed | { ok: true } | null,
  saved?: string,
) {
  const form = useRef<HTMLFormElement>(null);
  const failed = state && !state.ok ? state : null;

  useEffect(() => {
    if (failed)
      form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [failed]);

  useEffect(() => {
    if (state?.ok && saved) toast.success(saved);
  }, [state, saved]);

  return {
    form,
    failed,
    fields: failed?.fieldErrors ?? {},
    values: failed?.values ?? {},
  };
}

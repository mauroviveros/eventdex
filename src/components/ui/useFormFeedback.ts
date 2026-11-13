import { useEffect, useRef } from "react";
import { toast } from "sonner";

type Failed = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
  values: Record<string, string>;
};

/**
 * An action that shows `saved` as a toast when it works. The toast goes out
 * with the response, not from an effect: a success that unmounts its form
 * (the first venue, publishing a draft) would never run the effect.
 */
export function announce<S extends { ok: boolean } | null, A extends unknown[]>(
  action: (prev: S, ...args: A) => Promise<S>,
  /** Without one, the success stays silent (a form that navigates away). */
  saved?: string,
) {
  return async (prev: S, ...args: A) => {
    const next = await action(prev, ...args);
    if (next?.ok && saved) toast.success(saved);
    return next;
  };
}

/**
 * What a form needs from its action state: the failure (if any), its field
 * errors, the values to put back, and focus on the first field to fix. The
 * success toast comes from `announce`, around the action.
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

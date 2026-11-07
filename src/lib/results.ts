import { z } from "zod";

/** What every action returns: data, or a message in the product's voice. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

// Postgres error codes raised by the functions and constraints.
const MESSAGES: Record<string, string> = {
  "42501": "No tenés permiso para hacer esto.",
  "23514":
    "Algún dato no tiene el formato esperado. Revisalo y probá de nuevo.",
};
const FALLBACK = "No pudimos guardar. Probá de nuevo en un rato.";

/** A database error as a message. `messages` overrides codes for one action. */
export function failed(
  error: { code?: string; message?: string } | null,
  messages: Record<string, string> = {},
) {
  const code = error?.code ?? "";
  const message = messages[code] ?? MESSAGES[code] ?? FALLBACK;
  // The technical detail goes to the log, never to the screen.
  if (message === FALLBACK) console.error("action failed", error);
  return { ok: false as const, error: message };
}

/** Zod issues as one message per field. */
export function invalid(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0]);
    fieldErrors[field] ??= issue.message;
  }
  return {
    ok: false as const,
    error: "Revisá los datos marcados.",
    fieldErrors,
  };
}

/** An optional text field: trimmed, capped, and null when left empty. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Puede tener hasta ${max} caracteres.`)
    .optional()
    .transform((v) => v || null);

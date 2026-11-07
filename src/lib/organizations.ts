import { z } from "zod";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Organization actions without the framework around them: validate the input,
 * call the database function, translate its errors. The Server Actions in
 * src/lib/actions/organizations.ts wrap these with the session and cache.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

// Same rule as the organization_domains_hostname_format check.
const HOSTNAME =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]{2,5})?$/;

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Poné un nombre de al menos 2 letras.")
    .max(120, "El nombre puede tener hasta 120 caracteres."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,62}$/,
      "Usá minúsculas, números y guiones, sin espacios. Ej.: expo-ubbe.",
    ),
  hostname: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      HOSTNAME,
      "Escribí solo el dominio, sin https:// ni barras. Ej.: expo.com.ar.",
    ),
  ownerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Revisá el mail del owner.")),
});

export async function createOrganization(
  supabase: Pick<Supabase, "rpc">,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { name, slug, hostname, ownerEmail } = parsed.data;
  const { data, error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_slug: slug,
    p_hostname: hostname,
    p_owner_email: ownerEmail,
  });
  if (error || !data) return failed(error);
  return { ok: true, data: { id: data } };
}

export async function acceptInvitation(
  supabase: Pick<Supabase, "rpc">,
  invitationId: unknown,
): Promise<ActionResult<{ organizationId: string }>> {
  const parsed = z.uuid().safeParse(invitationId);
  if (!parsed.success) return { ok: false, error: MESSAGES.P0002 };

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_invitation_id: parsed.data,
  });
  if (error || !data) return failed(error);
  return { ok: true, data: { organizationId: data } };
}

// Postgres error codes raised by the functions and constraints, in the product's voice.
const MESSAGES = {
  "42501": "No tenés permiso para hacer esto.",
  "23505": "Ya existe una organización con ese slug o con ese dominio.",
  "23514":
    "Algún dato no tiene el formato esperado. Revisalo y probá de nuevo.",
  P0002: "La invitación no existe, ya se usó, venció o es para otra cuenta.",
} satisfies Record<string, string>;
const FALLBACK = "No pudimos guardar. Probá de nuevo en un rato.";

function failed(error: { code?: string; message?: string } | null) {
  const known: Record<string, string | undefined> = MESSAGES;
  const message = (error?.code && known[error.code]) || FALLBACK;
  // The technical detail goes to the log, never to the screen.
  if (message === FALLBACK) console.error("organizations action failed", error);
  return { ok: false as const, error: message };
}

function invalid(error: z.ZodError) {
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

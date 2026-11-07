import { z } from "zod";
import { type ActionResult, failed, invalid } from "@/lib/results";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Organization actions without the framework around them: validate the input,
 * call the database function, translate its errors. The Server Actions in
 * src/lib/actions/organizations.ts wrap these with the session and cache.
 */

// Same rule as the organizations and events slug_format checks.
export const SLUG = /^[a-z0-9][a-z0-9-]{1,62}$/;

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
      SLUG,
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
  if (error || !data)
    return failed(error, {
      "23505": "Ya existe una organización con ese slug o con ese dominio.",
    });
  return { ok: true, data: { id: data } };
}

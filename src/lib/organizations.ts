import { z } from "zod";
import { isTimeZone } from "@/domain/events";
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

const orgName = z
  .string()
  .trim()
  .min(2, "Poné un nombre de al menos 2 letras.")
  .max(120, "El nombre puede tener hasta 120 caracteres.");

const hostname = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    HOSTNAME,
    "Escribí solo el dominio, sin https:// ni barras. Ej.: expo.com.ar.",
  );

const createOrganizationSchema = z.object({
  name: orgName,
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      SLUG,
      "Usá minúsculas, números y guiones, sin espacios. Ej.: expo-ubbe.",
    ),
  hostname,
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

// Same rule as the organizations_brand_color_format check. Any hue is valid:
// the ramp fixes each tone's lightness, so contrast holds (DESIGN_SYSTEM).
const settingsSchema = z.object({
  organizationId: z.guid(),
  name: orgName,
  brandColor: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^#[0-9a-f]{6}$/, "Elegí un color válido."),
  defaultTimezone: z
    .string()
    .trim()
    .refine(isTimeZone, "Elegí una zona horaria válida."),
});

export async function updateSettings(
  supabase: Pick<Supabase, "from">,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const { data, error } = await supabase
    .from("organizations")
    .update({
      name: v.name,
      brand_color: v.brandColor,
      default_timezone: v.defaultTimezone,
    })
    .eq("id", v.organizationId)
    .select("id");
  if (error) return failed(error);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

const LOGO_BUCKET = "org-logos";

// Same limits as the bucket; here so the owner gets a message about their file.
export const LOGO_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

export const logoFile = z
  .file("Elegí una imagen.")
  .max(1024 * 1024, "El logo puede pesar hasta 1 MB.")
  .mime(
    Object.keys(LOGO_TYPES) as (keyof typeof LOGO_TYPES)[],
    "Subí una imagen PNG, JPG o WebP.",
  );

const logoSchema = z.object({
  organizationId: z.guid(),
  logo: logoFile,
});

/** Each upload gets a new name, so a browser or CDN never shows the old logo. */
export async function storeLogo(
  supabase: Pick<Supabase, "storage">,
  bucket: string,
  organizationId: string,
  logo: File,
) {
  const extension = LOGO_TYPES[logo.type as keyof typeof LOGO_TYPES];
  const path = `${organizationId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, logo, { contentType: logo.type });
  return { path, error };
}

type Storage = Pick<Supabase, "from" | "storage">;

async function currentLogo(supabase: Storage, organizationId: string) {
  return supabase
    .from("organizations")
    .select("logo_path")
    .eq("id", organizationId)
    .maybeSingle();
}

/** Points the org at `path` and deletes the previous file. A file that stays behind is only an orphan. */
async function swapLogo(
  supabase: Storage,
  organizationId: string,
  path: string | null,
  previous: string | null,
): Promise<ActionResult<null>> {
  const { data, error } = await supabase
    .from("organizations")
    .update({ logo_path: path })
    .eq("id", organizationId)
    .select("id");
  if (error || data.length === 0) {
    if (path) await supabase.storage.from(LOGO_BUCKET).remove([path]);
    return failed(error ?? { code: "42501" });
  }
  if (previous) await supabase.storage.from(LOGO_BUCKET).remove([previous]);
  return { ok: true, data: null };
}

export async function uploadLogo(
  supabase: Storage,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = logoSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { organizationId, logo } = parsed.data;

  const { data: org, error } = await currentLogo(supabase, organizationId);
  if (error) return failed(error);
  if (!org) return failed({ code: "42501" });

  const { path, error: uploadError } = await storeLogo(
    supabase,
    LOGO_BUCKET,
    organizationId,
    logo,
  );
  if (uploadError) return failed(uploadError);

  return swapLogo(supabase, organizationId, path, org.logo_path);
}

export async function removeLogo(
  supabase: Storage,
  organizationId: string,
): Promise<ActionResult<null>> {
  if (!z.guid().safeParse(organizationId).success)
    return failed({ code: "42501" });
  const { data: org, error } = await currentLogo(supabase, organizationId);
  if (error) return failed(error);
  if (!org) return failed({ code: "42501" });
  return swapLogo(supabase, organizationId, null, org.logo_path);
}

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

export type DomainConflict = {
  owner_id: string;
  owner_name: string;
  next_primary: string | null;
};

/** `conflict`: another org has the domain, nothing changed. Ask before moving it. */
export async function assignDomain(
  supabase: Pick<Supabase, "rpc">,
  input: unknown,
): Promise<ActionResult<{ conflict: DomainConflict | null }>> {
  const parsed = z
    .object({
      organizationId: z.guid(),
      hostname,
      makePrimary: checkbox,
      transferFrom: z.guid().optional(),
    })
    .safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { organizationId, makePrimary, transferFrom } = parsed.data;
  const { data, error } = await supabase.rpc("assign_domain", {
    p_organization_id: organizationId,
    p_hostname: parsed.data.hostname,
    p_make_primary: makePrimary,
    p_transfer_from: transferFrom,
  });
  if (error)
    return failed(error, {
      "42710": "Esta organización ya tiene ese dominio.",
      "23001":
        "Es el único dominio de su organización: sumale otro antes de moverlo.",
      "23505": "Otro cambio se cruzó con este. Probá de nuevo.",
    });
  return { ok: true, data: { conflict: data[0] ?? null } };
}

export async function setPrimaryDomain(
  supabase: Pick<Supabase, "rpc">,
  domainId: string,
): Promise<ActionResult<null>> {
  if (!z.guid().safeParse(domainId).success) return failed({ code: "42501" });
  const { error } = await supabase.rpc("set_primary_domain", {
    p_domain_id: domainId,
  });
  return error ? failed(error) : { ok: true, data: null };
}

/** The primary domain stays: it is where the QR codes point. */
export async function removeDomain(
  supabase: Pick<Supabase, "from">,
  domainId: string,
): Promise<ActionResult<null>> {
  if (!z.guid().safeParse(domainId).success) return failed({ code: "42501" });
  const { data, error } = await supabase
    .from("organization_domains")
    .delete()
    .eq("id", domainId)
    .eq("is_primary", false)
    .select("id");
  if (error) return failed(error);
  if (data.length === 0)
    return {
      ok: false,
      error: "No se puede quitar el dominio principal: elegí otro primero.",
    };
  return { ok: true, data: null };
}

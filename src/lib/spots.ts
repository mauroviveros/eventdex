import { z } from "zod";
import { nextSpotCode, SPOT_TYPES } from "@/domain/spots";
import { logoFile, storeLogo } from "@/lib/organizations";
import {
  type ActionResult,
  failed,
  invalid,
  optionalText,
} from "@/lib/results";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Catalog and event-spot actions without the framework around them: validate,
 * write, translate errors. RLS decides who may write; the Server Actions in
 * src/lib/actions/spots.ts add the session and the cache.
 */

type Client = Pick<Supabase, "from">;
type WithStorage = Pick<Supabase, "from" | "storage">;

const LOGO_BUCKET = "spot-logos";

// Same rule as the event_spots_code_format check, after uppercasing.
const CODE = /^[A-Z0-9][A-Z0-9-]{0,9}$/;

const name = z
  .string()
  .trim()
  .min(2, "Poné un nombre de al menos 2 letras.")
  .max(120, "El nombre puede tener hasta 120 caracteres.");

const spotFields = {
  name,
  description: optionalText(500),
  type: z.enum(SPOT_TYPES, "Elegí un tipo."),
};

// A file input left empty arrives as a 0-byte File.
const optionalLogo = z.preprocess(
  (v) => (v instanceof File && v.size > 0 ? v : undefined),
  logoFile.optional(),
);

// A checkbox: present means on.
const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

export const spotSchema = z.object({
  organizationId: z.guid(),
  ...spotFields,
  logo: optionalLogo,
});
export const spotUpdateSchema = z.object({
  id: z.guid(),
  organizationId: z.guid(),
  ...spotFields,
  logo: optionalLogo,
  removeLogo: checkbox,
});

const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(CODE, "Hasta 10 letras, números o guiones. Ej.: A12.");

// Form numbers arrive as text; left empty, a spot is worth 1 point.
const points = z.preprocess(
  (v) => (v === "" || v === undefined ? 1 : v),
  z.coerce
    .number("Poné un número.")
    .int("Tiene que ser un número entero.")
    .min(1, "Mínimo 1 punto.")
    .max(1000, "Máximo 1000 puntos."),
);

export const eventSpotSchema = z.object({
  eventId: z.guid(),
  spotId: z.guid("Elegí un spot del catálogo."),
  booth: optionalText(60),
  points,
});

export const eventSpotUpdateSchema = z.object({
  id: z.guid(),
  code,
  nameOverride: optionalText(120),
  descriptionOverride: optionalText(500),
  booth: optionalText(60),
  points,
  isActive: checkbox,
});

const ADD_EVENT_SPOT_MESSAGES = {
  "23505": "Ese spot ya está en el evento.",
  "23514": "El spot está archivado: desarchivalo para usarlo en un evento.",
  "23503": "Elegí un spot de tu organización.",
};

const EVENT_SPOT_MESSAGES = {
  "23505": "Ese código ya está en el evento. Probá con otro.",
};

export async function createSpot(
  supabase: WithStorage,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = spotSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const s = parsed.data;
  let logoPath: string | null = null;
  if (s.logo) {
    const stored = await storeLogo(
      supabase,
      LOGO_BUCKET,
      s.organizationId,
      s.logo,
    );
    if (stored.error) return failed(stored.error);
    logoPath = stored.path;
  }

  const { data, error } = await supabase
    .from("spots")
    .insert({
      organization_id: s.organizationId,
      name: s.name,
      description: s.description,
      type: s.type,
      logo_path: logoPath,
    })
    .select("id")
    .single();
  if (error) return failed(error);
  return { ok: true, data };
}

/**
 * Catalog edits reach drafts; published editions keep their snapshot, so a
 * replaced logo's file stays in the bucket.
 */
// shortcut: replaced logos are never deleted, sweep the ones no snapshot uses if the bucket grows
export async function updateSpot(
  supabase: WithStorage,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = spotUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const s = parsed.data;
  // Left out of the update when the logo isn't touched.
  let logoPath: string | null | undefined = s.removeLogo ? null : undefined;
  if (s.logo) {
    const stored = await storeLogo(
      supabase,
      LOGO_BUCKET,
      s.organizationId,
      s.logo,
    );
    if (stored.error) return failed(stored.error);
    logoPath = stored.path;
  }

  const { data, error } = await supabase
    .from("spots")
    .update({
      name: s.name,
      description: s.description,
      type: s.type,
      logo_path: logoPath,
    })
    .eq("id", s.id)
    .select("id");
  if (error) return failed(error);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

/** Archived spots stay in past events but aren't offered for new ones. */
export async function setSpotArchived(
  supabase: Client,
  id: unknown,
  archived: boolean,
): Promise<ActionResult<null>> {
  const parsed = z.guid().safeParse(id);
  if (!parsed.success) return failed({ code: "42501" });

  const { data, error } = await supabase
    .from("spots")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", parsed.data)
    .select("id");
  if (error) return failed(error);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

export async function addEventSpot(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = eventSpotSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const s = parsed.data;
  // The code is generated, one past the event's highest.
  // shortcut: code computed in the app with one retry, move it to the database if concurrent adds become common
  for (let attempt = 1; ; attempt++) {
    const { data: event, error: readError } = await supabase
      .from("events")
      .select("organization_id, spots:event_spots (code)")
      .eq("id", s.eventId)
      .maybeSingle();
    if (readError) return failed(readError);
    if (!event) return failed({ code: "42501" });

    const { data, error } = await supabase
      .from("event_spots")
      .insert({
        event_id: s.eventId,
        organization_id: event.organization_id,
        spot_id: s.spotId,
        code: nextSpotCode(event.spots.map((e) => e.code)),
        booth: s.booth,
        points: s.points,
      })
      .select("id")
      .single();
    // Someone may have taken that code in between: read again, once.
    if (error?.code === "23505" && attempt === 1) continue;
    if (error) return failed(error, ADD_EVENT_SPOT_MESSAGES);
    return { ok: true, data };
  }
}

export async function updateEventSpot(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = eventSpotUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const s = parsed.data;
  const { data, error } = await supabase
    .from("event_spots")
    .update({
      code: s.code,
      name_override: s.nameOverride,
      description_override: s.descriptionOverride,
      booth: s.booth,
      points: s.points,
      is_active: s.isActive,
    })
    .eq("id", s.id)
    .select("id");
  if (error) return failed(error, EVENT_SPOT_MESSAGES);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

/** Takes a spot out of an event. Its printed QR stops working. */
export async function removeEventSpot(
  supabase: Client,
  id: unknown,
): Promise<ActionResult<null>> {
  const parsed = z.guid().safeParse(id);
  if (!parsed.success) return failed({ code: "42501" });

  const { data, error } = await supabase
    .from("event_spots")
    .delete()
    .eq("id", parsed.data)
    .select("id");
  if (error) {
    return failed(error, {
      // spot_claims restricts the delete: medals are history.
      "23503":
        "Este spot ya tiene medallas, así que no se puede quitar. Desactivalo para que deje de sumar.",
    });
  }
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

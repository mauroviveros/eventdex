import { z } from "zod";
import { SPOT_TYPES } from "@/domain/spots";
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

export const spotSchema = z.object({
  organizationId: z.uuid(),
  ...spotFields,
});
export const spotUpdateSchema = z.object({ id: z.uuid(), ...spotFields });

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
  eventId: z.uuid(),
  spotId: z.uuid("Elegí un spot del catálogo."),
  code,
  booth: optionalText(60),
  points,
});

export const eventSpotUpdateSchema = z.object({
  id: z.uuid(),
  code,
  nameOverride: optionalText(120),
  descriptionOverride: optionalText(500),
  booth: optionalText(60),
  points,
  // A checkbox: present means on.
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

const EVENT_SPOT_MESSAGES = {
  "23505":
    "Ese código o ese spot ya están en el evento. Probá con otro código.",
  "23514": "El spot está archivado: desarchivalo para usarlo en un evento.",
  "23503": "Elegí un spot de tu organización.",
};

export async function createSpot(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = spotSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const s = parsed.data;
  const { data, error } = await supabase
    .from("spots")
    .insert({
      organization_id: s.organizationId,
      name: s.name,
      description: s.description,
      type: s.type,
    })
    .select("id")
    .single();
  if (error) return failed(error);
  return { ok: true, data };
}

/** Catalog edits reach drafts; published editions keep their snapshot. */
export async function updateSpot(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = spotUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const s = parsed.data;
  const { data, error } = await supabase
    .from("spots")
    .update({ name: s.name, description: s.description, type: s.type })
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
  const parsed = z.uuid().safeParse(id);
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
  const { data: event, error: readError } = await supabase
    .from("events")
    .select("organization_id")
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
      code: s.code,
      booth: s.booth,
      points: s.points,
    })
    .select("id")
    .single();
  if (error) return failed(error, EVENT_SPOT_MESSAGES);
  return { ok: true, data };
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
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return failed({ code: "42501" });

  const { data, error } = await supabase
    .from("event_spots")
    .delete()
    .eq("id", parsed.data)
    .select("id");
  if (error) return failed(error);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

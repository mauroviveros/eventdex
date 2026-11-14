import { z } from "zod";
import { COVER_MAX_BYTES } from "@/domain/events";
import { LOGO_TYPES, storeLogo } from "@/lib/organizations";
import {
  type ActionResult,
  failed,
  invalid,
  optionalText,
} from "@/lib/results";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Raffle actions without the framework around them. Drawing, voiding and
 * publishing are SQL functions: they check membership and leave the audit row.
 */

type Client = Pick<Supabase, "from" | "rpc">;

const NOT_ALLOWED = { code: "42501" };

const raffleSchema = z.object({
  organizationId: z.guid(),
  eventId: z.guid(),
  title: z
    .string()
    .trim()
    .min(2, "Poné un nombre de al menos 2 letras.")
    .max(120, "El nombre puede tener hasta 120 caracteres."),
  minClaims: z.coerce
    .number<string>()
    .int("Tiene que ser un número entero.")
    .min(1, "Tiene que ser al menos una medalla.")
    .max(999, "Puede ser hasta 999 medallas."),
});

const voidDrawSchema = z.object({
  drawId: z.guid(),
  reason: z
    .string()
    .trim()
    .min(3, "Contá por qué se anula.")
    .max(300, "El motivo puede tener hasta 300 caracteres."),
});

export async function createRaffle(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = raffleSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const v = parsed.data;
  const { error } = await supabase.from("raffles").insert({
    organization_id: v.organizationId,
    event_id: v.eventId,
    title: v.title,
    min_claims: v.minClaims,
  });
  if (error) return failed(error);
  return { ok: true, data: null };
}

/** The draw that just came out: its name is the one frozen in the database. */
export type DrawnWinner = { id: string; drawNumber: number; name: string };

/** The winner as the stage shows it: with the photo and medals the card needs. */
export type StageWinner = DrawnWinner & {
  claims: number | null;
  avatarUrl: string | null;
};

export async function drawRaffle(
  supabase: Client,
  raffleId: unknown,
): Promise<ActionResult<DrawnWinner>> {
  const parsed = z.guid().safeParse(raffleId);
  if (!parsed.success) return failed(NOT_ALLOWED);

  const { data, error } = await supabase.rpc("draw_raffle", {
    p_raffle_id: parsed.data,
  });
  // Here 23514 only comes from draw_raffle's own raises, already in our voice.
  if (error) return failed(error, { "23514": error.message });
  return {
    ok: true,
    data: { id: data.id, drawNumber: data.draw_number, name: data.winner_name },
  };
}

export async function voidRaffleDraw(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = voidDrawSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { error } = await supabase.rpc("void_raffle_draw", {
    p_draw_id: parsed.data.drawId,
    p_reason: parsed.data.reason,
  });
  if (error) return failed(error);
  return { ok: true, data: null };
}

export async function publishRaffleWinners(
  supabase: Client,
  raffleId: unknown,
): Promise<ActionResult<null>> {
  const parsed = z.guid().safeParse(raffleId);
  if (!parsed.success) return failed(NOT_ALLOWED);

  const { error } = await supabase.rpc("publish_raffle_winners", {
    p_raffle_id: parsed.data,
  });
  if (error)
    return failed(error, {
      "23514": "Todavía no hay ganadores para publicar.",
    });
  return { ok: true, data: null };
}

const IMAGE_BUCKET = "raffle-images";

// A file input left empty arrives as a 0-byte File; a checkbox, present means on.
const prizeSchema = z.object({
  organizationId: z.guid(),
  raffleId: z.guid(),
  description: optionalText(500),
  image: z.preprocess(
    (v) => (v instanceof File && v.size > 0 ? v : undefined),
    z
      .file("Elegí una imagen.")
      .max(COVER_MAX_BYTES, "La imagen puede pesar hasta 1,5 MB.")
      .mime(
        Object.keys(LOGO_TYPES) as (keyof typeof LOGO_TYPES)[],
        "Subí una imagen PNG, JPG o WebP.",
      )
      .optional(),
  ),
  removeImage: z
    .string()
    .optional()
    .transform((v) => v !== undefined),
});

type WithStorage = Pick<Supabase, "from" | "storage">;

/**
 * Description and image of a prize: all the team can change on a raffle, since
 * its title and minimum may already have draws made with them. The previous
 * file is deleted once the raffle points to the new one; one that stays behind
 * is only an orphan.
 */
export async function updateRafflePrize(
  supabase: WithStorage,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = prizeSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  // Both ids in the filter: a raffle of another org reads as not found.
  const { data: current, error: readError } = await supabase
    .from("raffles")
    .select("image_path")
    .eq("id", v.raffleId)
    .eq("organization_id", v.organizationId)
    .maybeSingle();
  if (readError) return failed(readError);
  if (!current) return failed(NOT_ALLOWED);

  // Left out of the update when the image isn't touched.
  let imagePath: string | null | undefined = v.removeImage ? null : undefined;
  if (v.image) {
    const stored = await storeLogo(
      supabase,
      IMAGE_BUCKET,
      v.organizationId,
      v.image,
    );
    if (stored.error) return failed(stored.error);
    imagePath = stored.path;
  }

  const { data, error } = await supabase
    .from("raffles")
    .update({ description: v.description, image_path: imagePath })
    .eq("id", v.raffleId)
    .select("id");
  if (error || data.length === 0) {
    if (v.image && imagePath) {
      await supabase.storage.from(IMAGE_BUCKET).remove([imagePath]);
    }
    return failed(error ?? NOT_ALLOWED);
  }

  if (imagePath !== undefined && current.image_path) {
    await supabase.storage.from(IMAGE_BUCKET).remove([current.image_path]);
  }
  return { ok: true, data: null };
}

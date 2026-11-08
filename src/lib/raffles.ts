import { z } from "zod";
import { type ActionResult, failed, invalid } from "@/lib/results";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Raffle actions without the framework around them. Drawing, voiding and
 * publishing are SQL functions: they check membership and leave the audit row.
 */

type Client = Pick<Supabase, "from" | "rpc">;

const NOT_ALLOWED = { code: "42501" };

export const raffleSchema = z.object({
  organizationId: z.uuid(),
  eventId: z.uuid(),
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

export const voidDrawSchema = z.object({
  drawId: z.uuid(),
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

export async function drawRaffle(
  supabase: Client,
  raffleId: unknown,
): Promise<ActionResult<null>> {
  const parsed = z.uuid().safeParse(raffleId);
  if (!parsed.success) return failed(NOT_ALLOWED);

  const { error } = await supabase.rpc("draw_raffle", {
    p_raffle_id: parsed.data,
  });
  // Here 23514 only comes from draw_raffle's own raises, already in our voice.
  if (error) return failed(error, { "23514": error.message });
  return { ok: true, data: null };
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
  const parsed = z.uuid().safeParse(raffleId);
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

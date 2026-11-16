import { z } from "zod";
import {
  type ActionResult,
  failed,
  invalid,
  optionalText,
} from "@/lib/results";
import type { Supabase } from "@/lib/supabase/server";

/**
 * The team's merit awards. They are won in the database, inside claim_spot:
 * here the team only writes the rule, and RLS decides whose it is.
 */

type Client = Pick<Supabase, "from">;

const NOT_ALLOWED = { code: "42501" };

// A blank field is "no cap".
const slots = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.coerce
    .number<string>("Poné un número.")
    .int("Tiene que ser un número entero.")
    .min(1, "Tiene que ser al menos 1.")
    .max(9999, "Puede ser hasta 9999.")
    .optional(),
);

const title = z
  .string()
  .trim()
  .min(2, "Poné un nombre de al menos 2 letras.")
  .max(120, "El nombre puede tener hasta 120 caracteres.");

const createSchema = z
  .object({
    organizationId: z.guid(),
    eventId: z.guid(),
    title,
    description: optionalText(500),
    kind: z.enum(["count", "percent"], "Elegí cómo se gana."),
    threshold: z.coerce
      .number<string>("Poné un número.")
      .int("Tiene que ser un número entero.")
      .min(1, "Tiene que ser al menos 1.")
      .max(999, "Puede ser hasta 999."),
    slots,
  })
  .refine((v) => v.kind !== "percent" || v.threshold <= 100, {
    path: ["threshold"],
    message: "El porcentaje llega hasta 100.",
  });

const updateSchema = z.object({
  awardId: z.guid(),
  title,
  description: optionalText(500),
});

export async function createAward(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const v = parsed.data;
  const { error } = await supabase.from("event_awards").insert({
    organization_id: v.organizationId,
    event_id: v.eventId,
    title: v.title,
    description: v.description,
    kind: v.kind,
    threshold: v.threshold,
    slots: v.slots ?? null,
  });
  if (error) return failed(error);
  return { ok: true, data: null };
}

/** Only the name and the description: the rule is frozen once it can have winners. */
export async function updateAward(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const v = parsed.data;
  const { data, error } = await supabase
    .from("event_awards")
    .update({ title: v.title, description: v.description })
    .eq("id", v.awardId)
    .select("id");
  if (error) return failed(error);
  // An award of another org matches no row.
  if (data.length === 0) return failed(NOT_ALLOWED);
  return { ok: true, data: null };
}

export async function deleteAward(
  supabase: Client,
  awardId: unknown,
): Promise<ActionResult<null>> {
  const parsed = z.guid().safeParse(awardId);
  if (!parsed.success) return failed(NOT_ALLOWED);

  const { data, error } = await supabase
    .from("event_awards")
    .delete()
    .eq("id", parsed.data)
    .select("id");
  if (error) {
    return failed(error, {
      "23503": "Ya lo ganó alguien: no se puede quitar.",
    });
  }
  if (data.length === 0) return failed(NOT_ALLOWED);
  return { ok: true, data: null };
}

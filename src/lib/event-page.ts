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
 * What the staff loads for the event's public page: links, questions and
 * photos. RLS decides who may write; the Server Actions add the session and
 * the cache. The limits repeat the database's checks, so the message is ours.
 */

type Client = Pick<Supabase, "from">;
type WithStorage = Pick<Supabase, "from" | "storage">;

const PHOTO_BUCKET = "event-photos";
export const MAX_PHOTOS = 12;

const ref = z.object({ organizationId: z.guid(), eventId: z.guid() });

/** An optional link: https only, no spaces. The database checks the same. */
const optionalLink = z
  .string()
  .trim()
  .max(300, "El link puede tener hasta 300 caracteres.")
  .refine(
    (v) => v === "" || /^https:\/\/\S+$/.test(v),
    "Pegá un link que empiece con https://",
  )
  .optional()
  .transform((v) => v || null);

const linksSchema = z.object({
  eventId: z.guid(),
  website: optionalLink,
  instagram: optionalLink,
  tickets: optionalLink,
  map: optionalLink,
});

export async function updateEventLinks(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = linksSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const { data, error } = await supabase
    .from("events")
    .update({
      website_url: v.website,
      instagram_url: v.instagram,
      tickets_url: v.tickets,
      map_url: v.map,
    })
    .eq("id", v.eventId)
    .is("deleted_at", null)
    .select("id");
  if (error) return failed(error);
  // RLS hides what isn't yours: nothing updated means no permission.
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

const faqText = {
  question: z
    .string()
    .trim()
    .min(1, "Escribí la pregunta.")
    .max(160, "La pregunta puede tener hasta 160 caracteres."),
  answer: z
    .string()
    .trim()
    .min(1, "Escribí la respuesta.")
    .max(600, "La respuesta puede tener hasta 600 caracteres."),
};

const faqSchema = ref.extend(faqText);
const faqEditSchema = z.object({ faqId: z.guid(), ...faqText });

export async function addFaq(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const { error } = await supabase.from("event_faqs").insert({
    organization_id: v.organizationId,
    event_id: v.eventId,
    question: v.question,
    answer: v.answer,
  });
  if (error) return failed(error);
  return { ok: true, data: null };
}

export async function updateFaq(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = faqEditSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const { data, error } = await supabase
    .from("event_faqs")
    .update({ question: v.question, answer: v.answer })
    .eq("id", v.faqId)
    .select("id");
  if (error) return failed(error);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

export async function deleteFaq(
  supabase: Client,
  faqId: unknown,
): Promise<ActionResult<null>> {
  const parsed = z.guid().safeParse(faqId);
  if (!parsed.success) return failed({ code: "42501" });

  const { data, error } = await supabase
    .from("event_faqs")
    .delete()
    .eq("id", parsed.data)
    .select("id");
  if (error) return failed(error);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

const photoSchema = ref.extend({
  caption: optionalText(120),
  photo: z
    .file("Elegí una foto.")
    .max(COVER_MAX_BYTES, "La foto puede pesar hasta 1,5 MB.")
    .mime(
      Object.keys(LOGO_TYPES) as (keyof typeof LOGO_TYPES)[],
      "Subí una imagen PNG, JPG o WebP.",
    ),
});

/** Uploads the file, then the row; if the row is refused the file goes too. */
export async function addPhoto(
  supabase: WithStorage,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = photoSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const { path, error: uploadError } = await storeLogo(
    supabase,
    PHOTO_BUCKET,
    v.organizationId,
    v.photo,
  );
  if (uploadError) return failed(uploadError);

  const { error } = await supabase.from("event_photos").insert({
    organization_id: v.organizationId,
    event_id: v.eventId,
    path,
    caption: v.caption,
  });
  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    return failed(error, {
      "23514": `Una portada puede tener hasta ${MAX_PHOTOS} fotos. Borrá alguna para sumar otra.`,
    });
  }
  return { ok: true, data: null };
}

const captionSchema = z.object({
  photoId: z.guid(),
  caption: optionalText(120),
});

export async function updatePhotoCaption(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = captionSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { data, error } = await supabase
    .from("event_photos")
    .update({ caption: parsed.data.caption })
    .eq("id", parsed.data.photoId)
    .select("id");
  if (error) return failed(error);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

/** The row goes first; a file left behind is only an orphan. */
export async function deletePhoto(
  supabase: WithStorage,
  photoId: unknown,
): Promise<ActionResult<null>> {
  const parsed = z.guid().safeParse(photoId);
  if (!parsed.success) return failed({ code: "42501" });

  const { data, error } = await supabase
    .from("event_photos")
    .delete()
    .eq("id", parsed.data)
    .select("path");
  if (error) return failed(error);
  const path = data[0]?.path;
  if (!path) return failed({ code: "42501" });
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  return { ok: true, data: null };
}

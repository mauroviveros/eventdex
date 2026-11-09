import { z } from "zod";
import { isTimeZone, localToInstant } from "@/domain/events";
import { SLUG } from "@/lib/organizations";
import {
  type ActionResult,
  failed,
  invalid,
  optionalText,
} from "@/lib/results";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Venue, event and schedule actions without the framework around them:
 * validate, write, translate errors. RLS decides who may write; the Server
 * Actions in src/lib/actions/events.ts add the session and the cache.
 */

type Client = Pick<Supabase, "from" | "rpc">;

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const timezone = z
  .string()
  .trim()
  .refine(isTimeZone, "Elegí una zona horaria válida.");

export const venueSchema = z.object({
  organizationId: z.guid(),
  name: z
    .string()
    .trim()
    .min(2, "Poné un nombre de al menos 2 letras.")
    .max(120, "El nombre puede tener hasta 120 caracteres."),
  addressLine: optionalText(200),
  city: optionalText(120),
  state: optionalText(120),
  postalCode: optionalText(20),
  timezone,
});

export const eventSchema = z.object({
  organizationId: z.guid(),
  title: z
    .string()
    .trim()
    .min(2, "Poné un nombre de al menos 2 letras.")
    .max(160, "El nombre puede tener hasta 160 caracteres."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      SLUG,
      "Usá minúsculas, números y guiones, sin espacios. Ej.: expo-2026.",
    ),
  // An empty select means "no venue yet".
  venueId: z
    .union([z.literal(""), z.guid()])
    .optional()
    .transform((v) => v || null),
  editionLabel: optionalText(40),
  summary: optionalText(280),
  timezone,
});

export const scheduleSchema = z
  .object({
    eventId: z.guid(),
    label: optionalText(60),
    startsAt: z
      .string()
      .regex(LOCAL_DATE_TIME, "Elegí fecha y hora de inicio."),
    endsAt: z.string().regex(LOCAL_DATE_TIME, "Elegí fecha y hora de fin."),
  })
  // Same zone on both sides, so comparing the wall-clock strings is enough.
  .refine((v) => v.endsAt > v.startsAt, {
    path: ["endsAt"],
    message: "El fin tiene que ser después del inicio.",
  });

export async function createVenue(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = venueSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const v = parsed.data;
  const { data, error } = await supabase
    .from("venues")
    .insert({
      organization_id: v.organizationId,
      name: v.name,
      address_line: v.addressLine,
      city: v.city,
      state: v.state,
      postal_code: v.postalCode,
      timezone: v.timezone,
    })
    .select("id")
    .single();
  if (error) return failed(error);
  return { ok: true, data };
}

export async function createEvent(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const e = parsed.data;
  const { data, error } = await supabase
    .from("events")
    .insert({
      organization_id: e.organizationId,
      venue_id: e.venueId,
      slug: e.slug,
      title: e.title,
      edition_label: e.editionLabel,
      summary: e.summary,
      timezone: e.timezone,
    })
    .select("id, slug")
    .single();
  if (error)
    return failed(error, {
      "23505": "Ya hay un evento con esa dirección en tu organización.",
      "23503": "Elegí una sede de tu organización.",
    });
  return { ok: true, data };
}

/** The form sends wall-clock times; they are read in the event's zone. */
export async function addSchedule(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const s = parsed.data;
  const { data: event, error: readError } = await supabase
    .from("events")
    .select("organization_id, timezone")
    .eq("id", s.eventId)
    .maybeSingle();
  if (readError) return failed(readError);
  if (!event) return failed({ code: "42501" });

  const { data, error } = await supabase
    .from("event_schedules")
    .insert({
      event_id: s.eventId,
      organization_id: event.organization_id,
      label: s.label,
      starts_at: localToInstant(s.startsAt, event.timezone).toISOString(),
      ends_at: localToInstant(s.endsAt, event.timezone).toISOString(),
    })
    .select("id")
    .single();
  if (error) return failed(error);
  return { ok: true, data };
}

export async function deleteSchedule(
  supabase: Client,
  id: unknown,
): Promise<ActionResult<null>> {
  const parsed = z.guid().safeParse(id);
  if (!parsed.success) return failed({ code: "42501" });

  const { data, error } = await supabase
    .from("event_schedules")
    .delete()
    .eq("id", parsed.data)
    .select("id");
  if (error)
    return failed(error, {
      "23514":
        "Un evento publicado necesita al menos una jornada. Agregá otra antes de quitar esta.",
    });
  // RLS hides what isn't yours: nothing deleted means no permission.
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

export async function publishEvent(
  supabase: Client,
  eventId: unknown,
): Promise<ActionResult<null>> {
  const parsed = z.guid().safeParse(eventId);
  if (!parsed.success) return failed({ code: "42501" });

  const { error } = await supabase.rpc("publish_event", {
    p_event_id: parsed.data,
  });
  if (error)
    return failed(error, {
      "23514":
        "Para publicar, el evento tiene que ser un borrador con al menos una jornada.",
    });
  return { ok: true, data: null };
}

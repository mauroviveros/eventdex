import { z } from "zod";
import {
  COVER_MAX_BYTES,
  eventSlug,
  isTimeZone,
  localToInstant,
} from "@/domain/events";
import { LOGO_TYPES, storeLogo } from "@/lib/organizations";
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

const EVENT_ERRORS = { "23503": "Elegí una sede de tu organización." };

/**
 * The address comes from the name and edition, so a taken one means the org
 * already has an event with both: likely a repeat, so it's refused.
 */
function eventWriteFailed(error: { code?: string; message?: string }) {
  if (
    error.code === "23505" &&
    error.message?.includes("events_org_slug_unique")
  )
    return {
      ok: false as const,
      error: "Revisá los datos marcados.",
      fieldErrors: {
        editionLabel:
          "Ya hay un evento con este nombre y edición. Poné otra edición.",
      },
    };
  return failed(error, EVENT_ERRORS);
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
      slug: eventSlug(e.title, e.editionLabel),
      title: e.title,
      edition_label: e.editionLabel,
      summary: e.summary,
      timezone: e.timezone,
    })
    .select("id, slug")
    .single();
  if (error) return eventWriteFailed(error);
  return { ok: true, data };
}

const eventEditSchema = eventSchema
  .pick({ title: true, editionLabel: true, summary: true })
  .extend({ eventId: z.guid() });

/**
 * Changes the event's own data. The address (slug) stays the one it got when
 * it was created: renaming doesn't move its page or its public link.
 */
export async function updateEvent(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = eventEditSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const e = parsed.data;

  const { data, error } = await supabase
    .from("events")
    .update({
      title: e.title,
      edition_label: e.editionLabel,
      summary: e.summary,
    })
    .eq("id", e.eventId)
    .is("deleted_at", null)
    .select("id");
  if (error) return failed(error);
  // RLS hides what isn't yours: nothing updated means no permission.
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

const venueChangeSchema = eventSchema
  .pick({ venueId: true })
  .extend({ eventId: z.guid() });

/** Sets or clears the venue. With one, the event takes its zone; without, it keeps the one it had. */
export async function setEventVenue(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = venueChangeSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { eventId, venueId } = parsed.data;

  const change: { venue_id: string | null; timezone?: string } = {
    venue_id: venueId,
  };
  if (venueId) {
    const { data: venue, error } = await supabase
      .from("venues")
      .select("timezone")
      .eq("id", venueId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return failed(error);
    if (!venue) return failed({ code: "23503" }, EVENT_ERRORS);
    change.timezone = venue.timezone;
  }

  const { data, error } = await supabase
    .from("events")
    .update(change)
    .eq("id", eventId)
    .is("deleted_at", null)
    .select("id");
  if (error) return failed(error, EVENT_ERRORS);
  // RLS hides what isn't yours: nothing updated means no permission.
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

const duplicateSchema = eventSchema.extend({ sourceId: z.guid() });

/** A new draft with the data typed in the form and the spots of `sourceId`. */
export async function duplicateEvent(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<{ slug: string }>> {
  const parsed = duplicateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const e = parsed.data;
  const { data, error } = await supabase.rpc("duplicate_event", {
    p_source_id: e.sourceId,
    p_slug: eventSlug(e.title, e.editionLabel),
    p_title: e.title,
    p_timezone: e.timezone,
    p_edition_label: e.editionLabel ?? undefined,
    p_summary: e.summary ?? undefined,
    p_venue_id: e.venueId ?? undefined,
  });
  if (error) return eventWriteFailed(error);
  return { ok: true, data: { slug: data } };
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

const scheduleEditSchema = scheduleSchema.safeExtend({ id: z.guid() });

/** Corrects a schedule: its name and times, read in the event's zone. */
export async function updateSchedule(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = scheduleEditSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const s = parsed.data;
  const { data: event, error: readError } = await supabase
    .from("events")
    .select("timezone")
    .eq("id", s.eventId)
    .maybeSingle();
  if (readError) return failed(readError);
  if (!event) return failed({ code: "42501" });

  const { data, error } = await supabase
    .from("event_schedules")
    .update({
      label: s.label,
      starts_at: localToInstant(s.startsAt, event.timezone).toISOString(),
      ends_at: localToInstant(s.endsAt, event.timezone).toISOString(),
    })
    .eq("id", s.id)
    .eq("event_id", s.eventId)
    .select("id");
  if (error) return failed(error);
  // RLS hides what isn't yours: nothing updated means no permission.
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
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

const COVER_BUCKET = "event-covers";

const eventRef = z.object({ organizationId: z.guid(), eventId: z.guid() });

const coverSchema = eventRef.extend({
  cover: z
    .file("Elegí una imagen.")
    .max(COVER_MAX_BYTES, "El banner puede pesar hasta 1,5 MB.")
    .mime(
      Object.keys(LOGO_TYPES) as (keyof typeof LOGO_TYPES)[],
      "Subí una imagen PNG, JPG o WebP.",
    ),
});

type Storage = Pick<Supabase, "from" | "storage">;

type EventRef = z.infer<typeof eventRef>;

/** Both ids in the filter: an event of another org reads as not found. */
async function currentCover(supabase: Storage, ref: EventRef) {
  return supabase
    .from("events")
    .select("cover_path")
    .eq("id", ref.eventId)
    .eq("organization_id", ref.organizationId)
    .maybeSingle();
}

/** Points the event at `path` and deletes the previous file. A file that stays behind is only an orphan. */
async function swapCover(
  supabase: Storage,
  eventId: string,
  path: string | null,
  previous: string | null,
): Promise<ActionResult<null>> {
  const { data, error } = await supabase
    .from("events")
    .update({ cover_path: path })
    .eq("id", eventId)
    .select("id");
  if (error || data.length === 0) {
    if (path) await supabase.storage.from(COVER_BUCKET).remove([path]);
    return failed(error ?? { code: "42501" });
  }
  if (previous) await supabase.storage.from(COVER_BUCKET).remove([previous]);
  return { ok: true, data: null };
}

export async function uploadCover(
  supabase: Storage,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = coverSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { cover, ...ref } = parsed.data;

  const { data: event, error } = await currentCover(supabase, ref);
  if (error) return failed(error);
  if (!event) return failed({ code: "42501" });

  const { path, error: uploadError } = await storeLogo(
    supabase,
    COVER_BUCKET,
    ref.organizationId,
    cover,
  );
  if (uploadError) return failed(uploadError);

  return swapCover(supabase, ref.eventId, path, event.cover_path);
}

export async function removeCover(
  supabase: Storage,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = eventRef.safeParse(input);
  if (!parsed.success) return failed({ code: "42501" });

  const { data: event, error } = await currentCover(supabase, parsed.data);
  if (error) return failed(error);
  if (!event) return failed({ code: "42501" });
  return swapCover(supabase, parsed.data.eventId, null, event.cover_path);
}

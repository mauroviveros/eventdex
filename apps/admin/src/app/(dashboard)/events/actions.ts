"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/libs/supabase/service";
import {
  type EventFormErrors,
  parseEventForm,
  parseScheduleForm,
} from "@/server/event-form";
import { requireMembership } from "@/server/guard";
import { localToUtcIso } from "@/utils";

export type EventFormState = { errors: EventFormErrors } | null;

/**
 * Todas las actions verifican membresía y que el evento pertenezca a la
 * organización del usuario antes de mutar: el service client no pasa por RLS,
 * así que el filtro por `organization_id` es la autorización.
 */
async function requireOrganizationEvent(eventId: string) {
  const { membership } = await requireMembership();
  const service = createServiceClient();
  const { data: event } = await service
    .from("events")
    .select("id, timezone, config")
    .eq("id", eventId)
    .eq("organization_id", membership.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!event) redirect("/events");
  return { service, event };
}

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const { membership } = await requireMembership();
  const { values, errors } = parseEventForm(formData);

  const schedule = parseScheduleForm(formData);
  if (schedule.error) errors.schedule = schedule.error;
  if (!values || schedule.error) return { errors };

  const start = localToUtcIso(schedule.values?.start ?? "", values.timezone);
  const end = localToUtcIso(schedule.values?.end ?? "", values.timezone);
  if (!start || !end) return { errors: { schedule: "Horario inválido." } };

  const service = createServiceClient();
  const { data: event, error } = await service
    .from("events")
    .insert({
      title: values.title,
      description: values.description,
      edition: values.edition,
      timezone: values.timezone,
      config: values.siteUrl ? { siteUrl: values.siteUrl } : {},
      status: "ACTIVE",
      organization_id: membership.organizationId,
    })
    .select("id")
    .single();

  if (error || !event) {
    return { errors: { _form: "No se pudo crear el evento." } };
  }

  // Ubicación y horario inicial; si fallan, el evento queda editable y ambos
  // se pueden completar desde el detalle.
  await service
    .from("event_locations")
    .insert({ event_id: event.id, ...values.location });
  await service.from("event_schedules").insert({
    event_id: event.id,
    start_datetime: start,
    end_datetime: end,
  });

  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}

export async function updateEvent(
  eventId: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const { service, event } = await requireOrganizationEvent(eventId);
  const { values, errors } = parseEventForm(formData);
  if (!values) return { errors };

  // config es JSON libre: se preserva lo que haya y solo se pisa siteUrl.
  const config = {
    ...(typeof event.config === "object" && event.config !== null
      ? event.config
      : {}),
    siteUrl: values.siteUrl ?? undefined,
  };

  const { error } = await service
    .from("events")
    .update({
      title: values.title,
      description: values.description,
      edition: values.edition,
      timezone: values.timezone,
      config,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) return { errors: { _form: "No se pudo guardar el evento." } };

  await service
    .from("event_locations")
    .upsert(
      { event_id: eventId, ...values.location },
      { onConflict: "event_id" },
    );

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  return null;
}

export async function setEventStatus(eventId: string, status: string) {
  const { service } = await requireOrganizationEvent(eventId);
  if (status !== "ACTIVE" && status !== "INACTIVE") return;

  await service
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", eventId);

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const { service } = await requireOrganizationEvent(eventId);

  await service
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", eventId);

  revalidatePath("/events");
  redirect("/events");
}

export async function addSchedule(eventId: string, formData: FormData) {
  const { service, event } = await requireOrganizationEvent(eventId);

  const { values, error } = parseScheduleForm(formData);
  if (error || !values) {
    redirect(`/events/${eventId}?scheduleError=1`);
  }

  const start = localToUtcIso(values.start, event.timezone);
  const end = localToUtcIso(values.end, event.timezone);
  if (!start || !end) redirect(`/events/${eventId}?scheduleError=1`);

  await service.from("event_schedules").insert({
    event_id: eventId,
    start_datetime: start,
    end_datetime: end,
  });

  revalidatePath(`/events/${eventId}`);
}

export async function deleteSchedule(eventId: string, scheduleId: number) {
  const { service } = await requireOrganizationEvent(eventId);

  await service
    .from("event_schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("event_id", eventId);

  revalidatePath(`/events/${eventId}`);
}

"use server";

import { redirect } from "next/navigation";
import {
  addSchedule,
  createEvent,
  createVenue,
  deleteSchedule,
  duplicateEvent,
  publishEvent,
  removeCover,
  setEventVenue,
  updateEvent,
  updateSchedule,
  uploadCover,
} from "@/lib/events";
import { type FormState, runFormWrite, takeLogo } from "./form";

/** Lands on the new draft, where its schedules and spots are adjusted. */
export async function duplicateEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, duplicateEvent);
  if (!r.ok) return r.state;
  const { slug } = r.data as { slug: string };
  redirect(`/${r.org}/eventos/${slug}`);
}

export async function uploadCoverAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const cover = takeLogo(formData);
  const r = await runFormWrite(formData, (supabase, v) =>
    uploadCover(supabase, { ...v, cover }),
  );
  return r.ok ? { ok: true } : r.state;
}

export async function removeCoverAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, removeCover);
  return r.ok ? { ok: true } : r.state;
}

export async function createVenueAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, createVenue);
  return r.ok ? { ok: true } : r.state;
}

/** Lands on the new event, where its schedules are added. */
export async function createEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, createEvent);
  if (!r.ok) return r.state;
  const { slug } = r.data as { slug: string };
  redirect(`/${r.org}/eventos/${slug}`);
}

export async function addScheduleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, addSchedule);
  return r.ok ? { ok: true } : r.state;
}

export async function deleteScheduleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    deleteSchedule(supabase, v.id),
  );
  return r.ok ? { ok: true } : r.state;
}

export async function publishEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    publishEvent(supabase, v.eventId),
  );
  return r.ok ? { ok: true } : r.state;
}

export async function setEventVenueAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, setEventVenue);
  return r.ok ? { ok: true } : r.state;
}

/** A new address moves the page: land on it, since the old one is gone. */
export async function updateEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const before = String(formData.get("currentSlug") ?? "");
  formData.delete("currentSlug");
  const r = await runFormWrite(formData, updateEvent);
  if (!r.ok) return r.state;
  const { slug } = r.data as { slug: string };
  if (slug !== before) redirect(`/${r.org}/eventos/${slug}`);
  return { ok: true };
}

export async function updateScheduleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, updateSchedule);
  return r.ok ? { ok: true } : r.state;
}

"use server";

import { redirect } from "next/navigation";
import {
  addSchedule,
  createEvent,
  createVenue,
  deleteSchedule,
  publishEvent,
  removeCover,
  uploadCover,
} from "@/lib/events";
import { type FormState, runFormWrite, takeLogo } from "./form";

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

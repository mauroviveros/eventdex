"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addSchedule,
  createEvent,
  createVenue,
  deleteSchedule,
  publishEvent,
  SLUG,
} from "@/lib/events";
import type { ActionResult } from "@/lib/results";
import { createClient } from "@/lib/supabase/server";

/**
 * Forms send the org slug in `org` (for the cache and the redirect) and the ids
 * in hidden fields. RLS checks that they belong to the user.
 */
export type EventFormState =
  | (Extract<ActionResult<never>, { ok: false }> & {
      values: Record<string, string>;
    })
  | { ok: true }
  | null;

type Write = (
  supabase: Awaited<ReturnType<typeof createClient>>,
  values: Record<string, string>,
) => Promise<ActionResult<unknown>>;

/** Runs a write and refreshes the org's admin pages. On error, the state keeps the values so nothing typed is lost. */
async function run(
  formData: FormData,
  write: Write,
): Promise<
  | { ok: false; state: EventFormState }
  | { ok: true; org: string; data: unknown }
> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const org = values.org ?? "";
  if (!SLUG.test(org)) {
    return {
      ok: false,
      state: { ok: false, error: "Falta la organización.", values },
    };
  }
  const result = await write(await createClient(), values);
  if (!result.ok) return { ok: false, state: { ...result, values } };
  revalidatePath(`/admin/${org}`, "layout");
  return { ok: true, org, data: result.data };
}

export async function createVenueAction(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const r = await run(formData, createVenue);
  return r.ok ? { ok: true } : r.state;
}

/** Lands on the new event, where its schedules are added. */
export async function createEventAction(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const r = await run(formData, createEvent);
  if (!r.ok) return r.state;
  const { slug } = r.data as { slug: string };
  redirect(`/${r.org}/eventos/${slug}`);
}

export async function addScheduleAction(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const r = await run(formData, addSchedule);
  return r.ok ? { ok: true } : r.state;
}

export async function deleteScheduleAction(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const r = await run(formData, (supabase, v) =>
    deleteSchedule(supabase, v.id),
  );
  return r.ok ? { ok: true } : r.state;
}

export async function publishEventAction(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const r = await run(formData, (supabase, v) =>
    publishEvent(supabase, v.eventId),
  );
  return r.ok ? { ok: true } : r.state;
}

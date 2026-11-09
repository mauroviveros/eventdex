"use server";

import { redirect } from "next/navigation";
import {
  addEventSpot,
  createSpot,
  removeEventSpot,
  setSpotArchived,
  updateEventSpot,
  updateSpot,
} from "@/lib/spots";
import { type FormState, runFormWrite, takeLogo } from "./form";

/** Lands on the catalog, where the new spot shows up. */
export async function createSpotAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const logo = takeLogo(formData);
  const r = await runFormWrite(formData, (supabase, v) =>
    createSpot(supabase, { ...v, logo }),
  );
  if (!r.ok) return r.state;
  redirect(`/${r.org}/spots`);
}

export async function updateSpotAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const logo = takeLogo(formData);
  const r = await runFormWrite(formData, (supabase, v) =>
    updateSpot(supabase, { ...v, logo }),
  );
  return r.ok ? { ok: true } : r.state;
}

/** `archived` is "1" to archive and "0" to bring it back. */
export async function setSpotArchivedAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    setSpotArchived(supabase, v.id, v.archived === "1"),
  );
  return r.ok ? { ok: true } : r.state;
}

export async function addEventSpotAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, addEventSpot);
  return r.ok ? { ok: true } : r.state;
}

export async function updateEventSpotAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, updateEventSpot);
  return r.ok ? { ok: true } : r.state;
}

export async function removeEventSpotAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    removeEventSpot(supabase, v.id),
  );
  return r.ok ? { ok: true } : r.state;
}

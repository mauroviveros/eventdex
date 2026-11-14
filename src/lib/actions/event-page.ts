"use server";

import {
  addFaq,
  addPhoto,
  deleteFaq,
  deletePhoto,
  updateEventLinks,
  updateFaq,
  updatePhotoCaption,
} from "@/lib/event-page";
import { type FormState, runFormWrite, takeLogo } from "./form";

/** The panel's forms for the event's public page. Each one refreshes the org's panel. */

export async function updateEventLinksAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, updateEventLinks);
  return r.ok ? { ok: true } : r.state;
}

export async function addFaqAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, addFaq);
  return r.ok ? { ok: true } : r.state;
}

export async function updateFaqAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, updateFaq);
  return r.ok ? { ok: true } : r.state;
}

export async function deleteFaqAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    deleteFaq(supabase, v.faqId),
  );
  return r.ok ? { ok: true } : r.state;
}

export async function addPhotoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // The file input is named "logo" by the shared upload field; see takeLogo.
  const photo = takeLogo(formData);
  const r = await runFormWrite(formData, (supabase, v) =>
    addPhoto(supabase, { ...v, photo }),
  );
  return r.ok ? { ok: true } : r.state;
}

export async function updatePhotoCaptionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, updatePhotoCaption);
  return r.ok ? { ok: true } : r.state;
}

export async function deletePhotoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    deletePhoto(supabase, v.photoId),
  );
  return r.ok ? { ok: true } : r.state;
}

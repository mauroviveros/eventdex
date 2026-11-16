"use server";

import { createAward, deleteAward, updateAward } from "@/lib/awards";
import { type FormState, runFormWrite } from "./form";

export async function createAwardAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, createAward);
  return r.ok ? { ok: true } : r.state;
}

export async function updateAwardAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, updateAward);
  return r.ok ? { ok: true } : r.state;
}

export async function deleteAwardAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    deleteAward(supabase, v.awardId),
  );
  return r.ok ? { ok: true } : r.state;
}

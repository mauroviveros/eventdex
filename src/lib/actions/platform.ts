"use server";

import { revalidatePath } from "next/cache";
import {
  createInvoice,
  setInvoiceStatus,
  setOrganizationStatus,
} from "@/lib/platform";
import type { ActionResult } from "@/lib/results";
import { createClient, type Supabase } from "@/lib/supabase/server";
import type { FormState } from "./form";
import { invalidateOrganizations } from "./invalidate";

async function runPlatformWrite(
  formData: FormData,
  write: (supabase: Supabase, input: unknown) => Promise<ActionResult<null>>,
): Promise<FormState> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const result = await write(await createClient(), values);
  if (!result.ok) return { ...result, values };
  revalidatePath("/admin/plataforma", "layout");
  return { ok: true };
}

export async function createInvoiceAction(
  _prev: FormState,
  formData: FormData,
) {
  return runPlatformWrite(formData, createInvoice);
}

export async function setInvoiceStatusAction(
  _prev: FormState,
  formData: FormData,
) {
  return runPlatformWrite(formData, setInvoiceStatus);
}

export async function setOrganizationStatusAction(
  _prev: FormState,
  formData: FormData,
) {
  const state = await runPlatformWrite(formData, setOrganizationStatus);
  // A suspended org must stop resolving on its domain right away.
  if (state?.ok) invalidateOrganizations();
  return state;
}

"use server";

import { revalidatePath } from "next/cache";
import {
  assignDomain,
  removeDomain,
  setPrimaryDomain,
} from "@/lib/organizations";
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

/** Domains show on the org's own settings and resolve on the public app. */
function refreshDomains() {
  revalidatePath("/admin", "layout");
  invalidateOrganizations();
}

export type DomainFormState =
  | FormState
  | {
      ok: false;
      error: string;
      values: Record<string, string>;
      /** The org that has the domain: the form asks before moving it. */
      conflict: string;
    };

export async function assignDomainAction(
  _prev: DomainFormState,
  formData: FormData,
): Promise<DomainFormState> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const result = await assignDomain(await createClient(), values);
  if (!result.ok) return { ...result, values };
  const { conflict } = result.data;
  if (conflict) {
    return { ok: false, error: "Ese dominio está en uso.", values, conflict };
  }
  refreshDomains();
  return { ok: true };
}

export async function setPrimaryDomainAction(
  _prev: FormState,
  formData: FormData,
) {
  const id = String(formData.get("id"));
  const state = await runPlatformWrite(formData, (supabase) =>
    setPrimaryDomain(supabase, id),
  );
  if (state?.ok) refreshDomains();
  return state;
}

export async function removeDomainAction(_prev: FormState, formData: FormData) {
  const id = String(formData.get("id"));
  const state = await runPlatformWrite(formData, (supabase) =>
    removeDomain(supabase, id),
  );
  if (state?.ok) refreshDomains();
  return state;
}

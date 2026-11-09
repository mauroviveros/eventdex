"use server";

import {
  addDomain,
  removeDomain,
  removeLogo,
  setPrimaryDomain,
  updateSettings,
  uploadLogo,
} from "@/lib/organizations";
import { type FormState, runFormWrite, takeLogo } from "./form";
import { invalidateOrganizations } from "./invalidate";

type Write = Parameters<typeof runFormWrite>[1];

/** Every write here shows on the public app, which caches the organization. */
async function runPublicWrite(formData: FormData, write: Write) {
  const r = await runFormWrite(formData, write);
  if (!r.ok) return r.state;
  invalidateOrganizations();
  return { ok: true as const };
}

export async function updateSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runPublicWrite(formData, updateSettings);
}

export async function uploadLogoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const logo = takeLogo(formData);
  return runPublicWrite(formData, (supabase, v) =>
    uploadLogo(supabase, { ...v, logo }),
  );
}

export async function removeLogoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runPublicWrite(formData, (supabase, v) =>
    removeLogo(supabase, v.organizationId ?? ""),
  );
}

export async function addDomainAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runPublicWrite(formData, addDomain);
}

export async function setPrimaryDomainAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runPublicWrite(formData, (supabase, v) =>
    setPrimaryDomain(supabase, v.id ?? ""),
  );
}

export async function removeDomainAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runPublicWrite(formData, (supabase, v) =>
    removeDomain(supabase, v.id ?? ""),
  );
}

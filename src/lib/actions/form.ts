import { revalidatePath } from "next/cache";
import { SLUG } from "@/lib/organizations";
import type { ActionResult } from "@/lib/results";
import { createClient, type Supabase } from "@/lib/supabase/server";

/**
 * Shared plumbing for the org panel's Server Actions. Forms send the org slug
 * in `org` (for the cache and the redirect) and the ids in hidden fields; RLS
 * checks that they belong to the user. Not a "use server" module: it only
 * exports helpers for the action files.
 */

/** What a panel form gets back. On error it keeps the values so nothing typed is lost. */
export type FormState =
  | (Extract<ActionResult<never>, { ok: false }> & {
      values: Record<string, string>;
    })
  | { ok: true }
  | null;

type Write = (
  supabase: Supabase,
  values: Record<string, string>,
) => Promise<ActionResult<unknown>>;

/** The file stays out of FormState: on error only the text values go back. */
export function takeLogo(formData: FormData) {
  const logo = formData.get("logo");
  formData.delete("logo");
  return logo;
}

/** Runs a write and refreshes the org's admin pages. */
export async function runFormWrite(
  formData: FormData,
  write: Write,
): Promise<
  { ok: false; state: FormState } | { ok: true; org: string; data: unknown }
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
  revalidatePath(`/panel/${org}`, "layout");
  return { ok: true, org, data: result.data };
}

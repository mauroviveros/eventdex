"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createOrganization } from "@/lib/organizations";
import type { ActionResult } from "@/lib/results";
import { createClient } from "@/lib/supabase/server";

export type CreateOrganizationState =
  | (Extract<ActionResult<never>, { ok: false }> & {
      values: Record<string, string>;
    })
  | null;

/** Developer: new organization + primary domain + owner invitation. Goes back to the list on success. */
export async function createOrganizationAction(
  _prev: CreateOrganizationState,
  formData: FormData,
): Promise<CreateOrganizationState> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const supabase = await createClient();
  const result = await createOrganization(supabase, values);
  // React resets the form after the action: send the values back so nothing typed is lost.
  if (!result.ok) return { ...result, values };
  revalidatePath("/admin/plataforma/organizaciones");
  redirect("/plataforma/organizaciones?creada=1");
}

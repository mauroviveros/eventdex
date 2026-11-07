"use server";

import { revalidatePath } from "next/cache";
import {
  type ActionResult,
  acceptInvitation,
  createOrganization,
} from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

/** Developer: new organization + primary domain + owner invitation. For useActionState. */
export async function createOrganizationAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const result = await createOrganization(
    supabase,
    Object.fromEntries(formData),
  );
  if (result.ok) revalidatePath("/admin/plataforma/organizaciones");
  return result;
}

/** Invitee: accepts and becomes a member. For useActionState. */
export async function acceptInvitationAction(
  _prev: ActionResult<{ organizationId: string }> | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const result = await acceptInvitation(supabase, formData.get("invitationId"));
  if (result.ok) revalidatePath("/admin");
  return result;
}

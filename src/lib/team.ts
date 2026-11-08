import { z } from "zod";
import { type ActionResult, failed, invalid } from "@/lib/results";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Team actions without the framework around them. RLS decides who may write;
 * the database keeps the last owner and leaves the audit trail.
 */

const role = z.enum(["owner", "staff"], "Elegí un rol.");

export const inviteSchema = z.object({
  organizationId: z.uuid(),
  email: z.string().trim().toLowerCase().pipe(z.email("Revisá el mail.")),
  role,
});

const KEEP_AN_OWNER = {
  "23514": "La organización tiene que conservar al menos un owner.",
};

/** No mail goes out: the invitation is accepted when that account signs in. */
export async function inviteMember(
  supabase: Pick<Supabase, "rpc">,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { organizationId, email, role } = parsed.data;
  const { data, error } = await supabase.rpc("invite_member", {
    p_organization_id: organizationId,
    p_email: email,
    p_role: role,
  });
  if (error || !data)
    return failed(error, {
      "23505":
        "Esa persona ya es parte del equipo o tiene una invitación abierta.",
    });
  return { ok: true, data: { id: data } };
}

export async function revokeInvitation(
  supabase: Pick<Supabase, "from">,
  id: string,
): Promise<ActionResult<null>> {
  if (!z.uuid().safeParse(id).success) return failed({ code: "42501" });
  const { data, error } = await supabase
    .from("organization_invitations")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return failed(error);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

export async function changeMemberRole(
  supabase: Pick<Supabase, "from">,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = z.object({ id: z.uuid(), role }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { data, error } = await supabase
    .from("organization_members")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return failed(error, KEEP_AN_OWNER);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

export async function removeMember(
  supabase: Pick<Supabase, "from">,
  id: string,
): Promise<ActionResult<null>> {
  if (!z.uuid().safeParse(id).success) return failed({ code: "42501" });
  const { data, error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return failed(error, KEEP_AN_OWNER);
  if (data.length === 0) return failed({ code: "42501" });
  return { ok: true, data: null };
}

"use server";

import {
  changeMemberRole,
  inviteMember,
  removeMember,
  revokeInvitation,
} from "@/lib/team";
import { type FormState, runFormWrite } from "./form";

export async function inviteMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, inviteMember);
  return r.ok ? { ok: true } : r.state;
}

export async function revokeInvitationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    revokeInvitation(supabase, v.id ?? ""),
  );
  return r.ok ? { ok: true } : r.state;
}

export async function changeMemberRoleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, changeMemberRole);
  return r.ok ? { ok: true } : r.state;
}

export async function removeMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    removeMember(supabase, v.id ?? ""),
  );
  return r.ok ? { ok: true } : r.state;
}

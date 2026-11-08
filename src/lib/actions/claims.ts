"use server";

import { setRegistrationBlocked } from "@/lib/claims";
import { type FormState, runFormWrite } from "./form";

/** Blocks (`blocked=1`) or unblocks a visitor from the event's visitor list. */
export async function setRegistrationBlockedAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    setRegistrationBlocked(supabase, v.id, v.blocked === "1"),
  );
  return r.ok ? { ok: true } : r.state;
}

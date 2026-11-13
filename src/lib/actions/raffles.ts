"use server";

import { revalidatePath } from "next/cache";
import { SLUG } from "@/lib/organizations";
import {
  createRaffle,
  type DrawnWinner,
  drawRaffle,
  publishRaffleWinners,
  voidRaffleDraw,
} from "@/lib/raffles";
import { type ActionResult, failed } from "@/lib/results";
import { createClient } from "@/lib/supabase/server";
import { type FormState, runFormWrite } from "./form";

/**
 * Draws from the stage screen, which needs the winner back to land on it (the
 * tab's draw only refreshes). Same function in the database, same checks.
 */
export async function drawOnStageAction(
  org: string,
  raffleId: string,
): Promise<ActionResult<DrawnWinner>> {
  if (!SLUG.test(org)) return failed({ code: "42501" });
  const result = await drawRaffle(await createClient(), raffleId);
  if (result.ok) revalidatePath(`/panel/${org}`, "layout");
  return result;
}

export async function createRaffleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, createRaffle);
  return r.ok ? { ok: true } : r.state;
}

export async function drawRaffleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    drawRaffle(supabase, v.raffleId),
  );
  return r.ok ? { ok: true } : r.state;
}

export async function voidRaffleDrawAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, voidRaffleDraw);
  return r.ok ? { ok: true } : r.state;
}

export async function publishRaffleWinnersAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const r = await runFormWrite(formData, (supabase, v) =>
    publishRaffleWinners(supabase, v.raffleId),
  );
  return r.ok ? { ok: true } : r.state;
}

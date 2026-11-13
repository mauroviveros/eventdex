"use server";

import { revalidatePath } from "next/cache";
import { getWinnerCard } from "@/lib/data/raffles";
import {
  createRaffle,
  drawRaffle,
  publishRaffleWinners,
  type StageWinner,
  voidRaffleDraw,
} from "@/lib/raffles";
import type { ActionResult } from "@/lib/results";
import { createClient } from "@/lib/supabase/server";
import { type FormState, runFormWrite } from "./form";

/**
 * Draws from the stage screen, which needs the winner back to land on it (the
 * tab's draw only refreshes). Same function in the database, same checks. It
 * refreshes every org's panel by pattern: the path is not the caller's to name.
 */
export async function drawOnStageAction(
  raffleId: string,
): Promise<ActionResult<StageWinner>> {
  const supabase = await createClient();
  const result = await drawRaffle(supabase, raffleId);
  if (!result.ok) return result;
  revalidatePath("/panel/[org]", "layout");
  const card = await getWinnerCard(supabase, result.data.id);
  return { ok: true, data: { ...result.data, ...card } };
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

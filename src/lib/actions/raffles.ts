"use server";

import {
  createRaffle,
  drawRaffle,
  publishRaffleWinners,
  voidRaffleDraw,
} from "@/lib/raffles";
import { type FormState, runFormWrite } from "./form";

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

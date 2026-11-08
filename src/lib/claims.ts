import { z } from "zod";
import { type ClaimResult, toClaimResult } from "@/domain/claims";
import { type ActionResult, failed } from "@/lib/results";
import type { Supabase } from "@/lib/supabase/server";

type Client = Pick<Supabase, "rpc">;

/**
 * Claims the medal of a QR for the signed-in visitor. claim_spot() does the
 * work in one transaction and is idempotent, so /s/[id] can call this on
 * every visit: scanning again only answers "repetida".
 * `data: null` means the QR is not of a published event (the page is a 404).
 */
export async function claimSpot(
  supabase: Client,
  eventSpotId: string,
): Promise<ActionResult<ClaimResult | null>> {
  if (!z.uuid().safeParse(eventSpotId).success) return { ok: true, data: null };
  const { data, error } = await supabase.rpc("claim_spot", {
    p_event_spot_id: eventSpotId,
  });
  if (error?.code === "P0002") return { ok: true, data: null };
  const row = data?.[0];
  if (error || !row) {
    return failed(error, { "42501": "Iniciá sesión para sumar la medalla." });
  }
  return { ok: true, data: toClaimResult(row) };
}

import { describe, expect, it, vi } from "vitest";
import { claimSpot } from "./claims";
import { fakeClient } from "./fake-supabase";

const QR = "0000000a-0000-4000-8000-000000000001";
const AT = "2026-11-14T15:00:00+00:00";
const START = "2026-11-14T13:00:00+00:00";
const END = "2026-11-15T23:00:00+00:00";

const row = (outcome: string, extra: Record<string, string | null> = {}) => ({
  data: [
    { outcome, claimed_at: null, starts_at: START, ends_at: END, ...extra },
  ],
  error: null,
});

describe("claimSpot: the five outcomes of the celebration", () => {
  it("a new medal", async () => {
    const { client, rpc } = fakeClient(row("new", { claimed_at: AT }));
    expect(await claimSpot(client, QR)).toEqual({
      ok: true,
      data: { kind: "nueva", claimedAt: AT },
    });
    expect(rpc).toHaveBeenCalledWith("claim_spot", { p_event_spot_id: QR });
  });

  it("one already claimed, with the first claim time", async () => {
    const { client } = fakeClient(row("repeat", { claimed_at: AT }));
    expect(await claimSpot(client, QR)).toEqual({
      ok: true,
      data: { kind: "repetida", claimedAt: AT },
    });
  });

  it("an inactive spot", async () => {
    const { client } = fakeClient(row("inactive"));
    expect(await claimSpot(client, QR)).toEqual({
      ok: true,
      data: { kind: "inactivo" },
    });
  });

  it("out of phase, telling an upcoming event from a finished one", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-10T12:00:00Z") });
    const before = fakeClient(row("out_of_phase"));
    expect(await claimSpot(before.client, QR)).toEqual({
      ok: true,
      data: {
        kind: "fuera-de-fase",
        startsAt: START,
        endsAt: END,
        ended: false,
      },
    });

    vi.setSystemTime(new Date("2026-11-20T12:00:00Z"));
    const after = fakeClient(row("out_of_phase"));
    expect(await claimSpot(after.client, QR)).toMatchObject({
      data: { kind: "fuera-de-fase", ended: true },
    });
    vi.useRealTimers();
  });

  it("a blocked visitor", async () => {
    const { client } = fakeClient(
      row("blocked", { starts_at: null, ends_at: null }),
    );
    expect(await claimSpot(client, QR)).toEqual({
      ok: true,
      data: { kind: "bloqueado" },
    });
  });
});

describe("claimSpot: QRs that lead nowhere", () => {
  it("a malformed id never reaches the database", async () => {
    const { client, rpc } = fakeClient();
    expect(await claimSpot(client, "no-es-un-id")).toEqual({
      ok: true,
      data: null,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("a QR of a draft or unknown event is missing", async () => {
    const { client } = fakeClient({ data: null, error: { code: "P0002" } });
    expect(await claimSpot(client, QR)).toEqual({ ok: true, data: null });
  });
});

describe("claimSpot: failures", () => {
  it("without a session asks to sign in", async () => {
    const { client } = fakeClient({ data: null, error: { code: "42501" } });
    expect(await claimSpot(client, QR)).toEqual({
      ok: false,
      error: "Iniciá sesión para sumar la medalla.",
    });
  });

  it("any other error is the generic message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeClient({ data: null, error: { code: "XX000" } });
    expect(await claimSpot(client, QR)).toMatchObject({ ok: false });
  });

  it("a row without its required field is a bug, not a medal", async () => {
    const { client } = fakeClient(row("new"));
    await expect(claimSpot(client, QR)).rejects.toThrow(/claimed_at/);
  });
});

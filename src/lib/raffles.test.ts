import { describe, expect, it, vi } from "vitest";
import { fakeClient, inserted } from "./fake-supabase";
import {
  createRaffle,
  drawRaffle,
  publishRaffleWinners,
  updateRafflePrize,
  voidRaffleDraw,
} from "./raffles";

const ORG = "0000000c-0000-4000-8000-000000000001";
const EVENT = "0000000c-0000-4000-8000-000000000002";
const RAFFLE = "0000000c-0000-4000-8000-000000000003";
const DRAW = "0000000c-0000-4000-8000-000000000004";

describe("createRaffle", () => {
  const valid = {
    organizationId: ORG,
    eventId: EVENT,
    title: " Bicicleta ",
    minClaims: "3",
  };

  it("normalizes the input", async () => {
    const { client, calls } = fakeClient({ data: null, error: null });
    expect(await createRaffle(client, valid)).toEqual({
      ok: true,
      data: null,
    });
    expect(inserted(calls)).toEqual({
      organization_id: ORG,
      event_id: EVENT,
      title: "Bicicleta",
      min_claims: 3,
    });
  });

  it.each(["0", "", "1.5", "muchas"])(
    "rejects %j medals before reaching the database",
    async (minClaims) => {
      const { client, calls } = fakeClient();
      const result = await createRaffle(client, { ...valid, minClaims });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fieldErrors?.minClaims).toBeDefined();
      expect(calls).toEqual([]);
    },
  );
});

describe("drawRaffle", () => {
  it("calls draw_raffle and returns the draw that came out", async () => {
    const { client, rpc } = fakeClient({
      data: { id: DRAW, draw_number: 2, winner_name: "Ana G." },
      error: null,
    });
    expect(await drawRaffle(client, RAFFLE)).toEqual({
      ok: true,
      data: { id: DRAW, drawNumber: 2, name: "Ana G." },
    });
    expect(rpc).toHaveBeenCalledWith("draw_raffle", { p_raffle_id: RAFFLE });
  });

  it("says so when nobody is eligible", async () => {
    const { client } = fakeClient({
      data: null,
      error: {
        code: "23514",
        message: "No hay participantes para este sorteo",
      },
    });
    expect(await drawRaffle(client, RAFFLE)).toEqual({
      ok: false,
      error: "No hay participantes para este sorteo",
    });
  });

  it("does not query with a malformed id", async () => {
    const { client, rpc } = fakeClient();
    expect((await drawRaffle(client, "nope")).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("voidRaffleDraw", () => {
  it("voids with the trimmed reason", async () => {
    const { client, rpc } = fakeClient({ data: {}, error: null });
    expect(
      await voidRaffleDraw(client, { drawId: DRAW, reason: " No estaba " }),
    ).toEqual({ ok: true, data: null });
    expect(rpc).toHaveBeenCalledWith("void_raffle_draw", {
      p_draw_id: DRAW,
      p_reason: "No estaba",
    });
  });

  it("asks for a reason", async () => {
    const { client, rpc } = fakeClient();
    const result = await voidRaffleDraw(client, { drawId: DRAW, reason: " " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.reason).toBeDefined();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects another org's draw", async () => {
    const { client } = fakeClient({ data: null, error: { code: "42501" } });
    expect(
      await voidRaffleDraw(client, { drawId: DRAW, reason: "No estaba" }),
    ).toEqual({ ok: false, error: "No tenés permiso para hacer esto." });
  });
});

describe("publishRaffleWinners", () => {
  it("calls publish_raffle_winners", async () => {
    const { client, rpc } = fakeClient({ data: null, error: null });
    expect(await publishRaffleWinners(client, RAFFLE)).toEqual({
      ok: true,
      data: null,
    });
    expect(rpc).toHaveBeenCalledWith("publish_raffle_winners", {
      p_raffle_id: RAFFLE,
    });
  });

  it("explains when every draw was voided", async () => {
    const { client } = fakeClient({ data: null, error: { code: "23514" } });
    expect(await publishRaffleWinners(client, RAFFLE)).toEqual({
      ok: false,
      error: "Todavía no hay ganadores para publicar.",
    });
  });
});

describe("updateRafflePrize", () => {
  const ORG = "0000000a-0000-4000-8000-000000000001";
  const ref = {
    organizationId: ORG,
    raffleId: "0000000a-0000-4000-8000-000000000002",
  };
  const png = () => new File(["x"], "premio.png", { type: "image/png" });

  function withStorage(...results: { data: unknown; error: unknown }[]) {
    const { client, calls } = fakeClient(...results);
    const upload = vi.fn(async (_path: string) => ({ error: null }));
    const remove = vi.fn(async () => ({ error: null }));
    return {
      client: {
        ...(client as object),
        storage: { from: () => ({ upload, remove }) },
      } as never,
      calls,
      upload,
      remove,
    };
  }

  it("saves the description and leaves the image alone when none comes", async () => {
    const { client, calls, upload, remove } = withStorage(
      { data: { image_path: `${ORG}/old.png` }, error: null },
      { data: [{ id: ref.raffleId }], error: null },
    );
    const result = await updateRafflePrize(client, {
      ...ref,
      description: " Rodado 29 ",
      image: new File([], "", { type: "application/octet-stream" }),
    });
    expect(result).toEqual({ ok: true, data: null });
    expect(calls.find((c) => c.method === "update")?.args[0]).toEqual({
      description: "Rodado 29",
      image_path: undefined,
    });
    expect(upload).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("uploads under the org folder and deletes the previous file", async () => {
    const { client, upload, remove } = withStorage(
      { data: { image_path: `${ORG}/old.png` }, error: null },
      { data: [{ id: ref.raffleId }], error: null },
    );
    const result = await updateRafflePrize(client, { ...ref, image: png() });
    expect(result.ok).toBe(true);
    expect(upload.mock.calls[0]?.[0]).toMatch(new RegExp(`^${ORG}/.+\\.png$`));
    expect(remove).toHaveBeenCalledWith([`${ORG}/old.png`]);
  });

  it("removes the image on request", async () => {
    const { client, calls, remove } = withStorage(
      { data: { image_path: `${ORG}/old.png` }, error: null },
      { data: [{ id: ref.raffleId }], error: null },
    );
    await updateRafflePrize(client, { ...ref, removeImage: "on" });
    expect(calls.find((c) => c.method === "update")?.args[0]).toMatchObject({
      image_path: null,
    });
    expect(remove).toHaveBeenCalledWith([`${ORG}/old.png`]);
  });

  it("deletes the new file if the raffle can't point to it", async () => {
    const { client, upload, remove } = withStorage(
      { data: { image_path: null }, error: null },
      { data: [], error: null },
    );
    const result = await updateRafflePrize(client, { ...ref, image: png() });
    expect(result.ok).toBe(false);
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0]?.[0]]);
  });

  it("uploads nothing for a raffle of another org", async () => {
    const { client, upload } = withStorage({ data: null, error: null });
    const result = await updateRafflePrize(client, { ...ref, image: png() });
    expect(result.ok).toBe(false);
    expect(upload).not.toHaveBeenCalled();
  });

  it.each([
    ["an SVG", new File(["x"], "a.svg", { type: "image/svg+xml" })],
    [
      "a file over 1,5 MB",
      new File([new Uint8Array(1_572_865)], "a.png", { type: "image/png" }),
    ],
  ])("rejects %s before uploading", async (_label, image) => {
    const { client, upload } = withStorage();
    const result = await updateRafflePrize(client, { ...ref, image });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.image).toBeTruthy();
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects a description over 500 characters", async () => {
    const { client } = withStorage();
    const result = await updateRafflePrize(client, {
      ...ref,
      description: "a".repeat(501),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.description).toBeTruthy();
  });
});

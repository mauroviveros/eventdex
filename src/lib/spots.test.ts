import { describe, expect, it, vi } from "vitest";
import { fakeClient, inserted } from "./fake-supabase";
import {
  addEventSpot,
  createSpot,
  removeEventSpot,
  setSpotArchived,
  updateEventSpot,
  updateSpot,
} from "./spots";

const ORG = "0000000a-0000-4000-8000-000000000001";
const EVENT = "0000000a-0000-4000-8000-000000000002";
const SPOT = "0000000a-0000-4000-8000-000000000003";

describe("createSpot", () => {
  it("normalizes the input", async () => {
    const { client, calls } = fakeClient({ data: { id: SPOT }, error: null });
    expect(
      await createSpot(client, {
        organizationId: ORG,
        name: "  Café de la Esquina ",
        description: "",
        type: "stand",
      }),
    ).toEqual({ ok: true, data: { id: SPOT } });
    expect(inserted(calls)).toEqual({
      organization_id: ORG,
      name: "Café de la Esquina",
      description: null,
      type: "stand",
      logo_path: null,
    });
  });

  it("rejects an unknown type", async () => {
    const { client, calls } = fakeClient();
    const result = await createSpot(client, {
      organizationId: ORG,
      name: "Kiosco",
      type: "kiosco",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.type).toBe("Elegí un tipo.");
    expect(calls).toEqual([]);
  });
});

describe("spot logos", () => {
  const png = () => new File(["x"], "logo.png", { type: "image/png" });
  const fields = { organizationId: ORG, name: "Kiosco", type: "stand" };

  function withStorage(...results: { data: unknown; error: unknown }[]) {
    const { client, calls } = fakeClient(...results);
    const upload = vi.fn(async (_path: string) => ({ error: null }));
    const remove = vi.fn();
    const storage = { from: vi.fn(() => ({ upload, remove })) };
    return {
      client: { ...(client as object), storage } as never,
      calls,
      upload,
      remove,
      storage,
    };
  }
  const updated = (calls: { method: string; args: unknown[] }[]) =>
    calls.find((c) => c.method === "update")?.args[0] as Record<
      string,
      unknown
    >;

  it("stores a new spot's logo under its org", async () => {
    const { client, calls, upload, storage } = withStorage({
      data: { id: SPOT },
      error: null,
    });
    await createSpot(client, { ...fields, logo: png() });
    expect(storage.from).toHaveBeenCalledWith("spot-logos");
    const path = upload.mock.calls[0]?.[0];
    expect(path).toMatch(new RegExp(`^${ORG}/.+\\.png$`));
    expect(inserted(calls)).toMatchObject({ logo_path: path });
  });

  it("treats an empty file input as no logo", async () => {
    const { client, upload } = withStorage({ data: { id: SPOT }, error: null });
    const empty = new File([], "", { type: "application/octet-stream" });
    const result = await createSpot(client, { ...fields, logo: empty });
    expect(result.ok).toBe(true);
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects an SVG before uploading", async () => {
    const { client, upload } = withStorage();
    const logo = new File(["x"], "a.svg", { type: "image/svg+xml" });
    const result = await createSpot(client, { ...fields, logo });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.fieldErrors?.logo).toBe("Subí una imagen PNG, JPG o WebP.");
    expect(upload).not.toHaveBeenCalled();
  });

  const edit = { ...fields, id: SPOT };
  const saved = { data: [{ id: SPOT }], error: null };

  it("leaves the logo alone when the edit doesn't touch it", async () => {
    const { client, calls } = withStorage(saved);
    await updateSpot(client, edit);
    expect(updated(calls).logo_path).toBeUndefined();
  });

  it("clears the logo but keeps the file a snapshot may use", async () => {
    const { client, calls, remove } = withStorage(saved);
    await updateSpot(client, { ...edit, removeLogo: "on" });
    expect(updated(calls).logo_path).toBeNull();
    expect(remove).not.toHaveBeenCalled();
  });

  it("a new file wins over the remove checkbox", async () => {
    const { client, calls, upload } = withStorage(saved);
    await updateSpot(client, { ...edit, removeLogo: "on", logo: png() });
    expect(updated(calls).logo_path).toBe(upload.mock.calls[0]?.[0]);
  });
});

describe("addEventSpot", () => {
  const valid = { eventId: EVENT, spotId: SPOT, points: "" };
  const event = (...codes: string[]) => ({
    data: { organization_id: ORG, spots: codes.map((code) => ({ code })) },
    error: null,
  });

  it("generates the next code, defaults to 1 point and takes the event's org", async () => {
    const { client, calls } = fakeClient(event("A01", "VIP"), {
      data: { id: "es1" },
      error: null,
    });
    expect(await addEventSpot(client, valid)).toEqual({
      ok: true,
      data: { id: "es1" },
    });
    expect(inserted(calls)).toEqual({
      event_id: EVENT,
      organization_id: ORG,
      spot_id: SPOT,
      code: "A02",
      booth: null,
      points: 1,
    });
  });

  it("reads the codes again when someone took the code in between", async () => {
    const { client, calls } = fakeClient(
      event("A01"),
      { data: null, error: { code: "23505" } },
      event("A01", "A02"),
      { data: { id: "es1" }, error: null },
    );
    expect(await addEventSpot(client, valid)).toEqual({
      ok: true,
      data: { id: "es1" },
    });
    expect(
      calls.filter((c) => c.method === "insert").map((c) => c.args[0]),
    ).toMatchObject([{ code: "A02" }, { code: "A03" }]);
  });

  it("explains a spot already in the event", async () => {
    const { client } = fakeClient(
      event("A01"),
      { data: null, error: { code: "23505" } },
      event("A01"),
      { data: null, error: { code: "23505" } },
    );
    expect(await addEventSpot(client, valid)).toEqual({
      ok: false,
      error: "Ese spot ya está en el evento.",
    });
  });

  it("explains an archived spot", async () => {
    const { client } = fakeClient(event(), {
      data: null,
      error: { code: "23514" },
    });
    const result = await addEventSpot(client, valid);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/archivado/);
  });
});

describe("updateEventSpot", () => {
  it("uppercases the code and rejects spaces or symbols", async () => {
    const { client, calls } = fakeClient({ data: [{ id: SPOT }], error: null });
    await updateEventSpot(client, { id: SPOT, code: " vip ", points: "1" });
    expect(calls.find((c) => c.method === "update")?.args[0]).toMatchObject({
      code: "VIP",
    });
    const result = await updateEventSpot(fakeClient().client, {
      id: SPOT,
      code: "A 12!",
      points: "1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.code).toBeDefined();
  });

  it("reads the active checkbox and rejects zero points", async () => {
    const { client } = fakeClient();
    const result = await updateEventSpot(client, {
      id: SPOT,
      code: "A12",
      points: "0",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.points).toBe("Mínimo 1 punto.");
  });

  it("turns an unchecked box into inactive", async () => {
    const { client, calls } = fakeClient({ data: [{ id: SPOT }], error: null });
    await updateEventSpot(client, { id: SPOT, code: "A12", points: "3" });
    expect(calls.find((c) => c.method === "update")?.args[0]).toMatchObject({
      points: 3,
      is_active: false,
    });
  });
});

describe("writes RLS hides", () => {
  it("say no permission when nothing changed", async () => {
    const { client } = fakeClient(
      { data: [], error: null },
      { data: [], error: null },
    );
    const denied = { ok: false, error: "No tenés permiso para hacer esto." };
    expect(await setSpotArchived(client, SPOT, true)).toEqual(denied);
    expect(await removeEventSpot(client, SPOT)).toEqual(denied);
  });
});

describe("removeEventSpot", () => {
  it("a spot with medals asks to deactivate it instead", async () => {
    const { client } = fakeClient({ data: null, error: { code: "23503" } });
    expect(await removeEventSpot(client, SPOT)).toEqual({
      ok: false,
      error:
        "Este spot ya tiene medallas, así que no se puede quitar. Desactivalo para que deje de sumar.",
    });
  });
});

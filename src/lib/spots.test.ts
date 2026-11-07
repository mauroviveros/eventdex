import { describe, expect, it } from "vitest";
import { fakeClient, inserted } from "./fake-supabase";
import {
  addEventSpot,
  createSpot,
  removeEventSpot,
  setSpotArchived,
  updateEventSpot,
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

describe("addEventSpot", () => {
  const valid = { eventId: EVENT, spotId: SPOT, code: " a12 ", points: "" };

  it("uppercases the code, defaults to 1 point and takes the event's org", async () => {
    const { client, calls } = fakeClient(
      { data: { organization_id: ORG }, error: null },
      { data: { id: "es1" }, error: null },
    );
    expect(await addEventSpot(client, valid)).toEqual({
      ok: true,
      data: { id: "es1" },
    });
    expect(inserted(calls)).toEqual({
      event_id: EVENT,
      organization_id: ORG,
      spot_id: SPOT,
      code: "A12",
      booth: null,
      points: 1,
    });
  });

  it("rejects codes with spaces or symbols", async () => {
    const { client, calls } = fakeClient();
    const result = await addEventSpot(client, { ...valid, code: "A 12!" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.code).toBeDefined();
    expect(calls).toEqual([]);
  });

  it("explains a repeated code", async () => {
    const { client } = fakeClient(
      { data: { organization_id: ORG }, error: null },
      { data: null, error: { code: "23505" } },
    );
    expect(await addEventSpot(client, valid)).toEqual({
      ok: false,
      error:
        "Ese código o ese spot ya están en el evento. Probá con otro código.",
    });
  });

  it("explains an archived spot", async () => {
    const { client } = fakeClient(
      { data: { organization_id: ORG }, error: null },
      { data: null, error: { code: "23514" } },
    );
    const result = await addEventSpot(client, valid);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/archivado/);
  });
});

describe("updateEventSpot", () => {
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

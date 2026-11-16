import { describe, expect, it } from "vitest";
import { createAward, deleteAward, updateAward } from "./awards";
import { fakeClient, inserted } from "./fake-supabase";

const ORG = "0000000d-0000-4000-8000-000000000001";
const EVENT = "0000000d-0000-4000-8000-000000000002";
const AWARD = "0000000d-0000-4000-8000-000000000003";

describe("createAward", () => {
  const valid = {
    organizationId: ORG,
    eventId: EVENT,
    title: " Primeros 5 ",
    description: "",
    kind: "percent",
    threshold: "100",
    slots: "5",
  };

  it("normalizes the input, an empty description is null", async () => {
    const { client, calls } = fakeClient({ data: null, error: null });
    expect(await createAward(client, valid)).toEqual({ ok: true, data: null });
    expect(inserted(calls)).toEqual({
      organization_id: ORG,
      event_id: EVENT,
      title: "Primeros 5",
      description: null,
      kind: "percent",
      threshold: 100,
      slots: 5,
    });
  });

  it("leaves the cap empty for everyone who gets there", async () => {
    const { client, calls } = fakeClient({ data: null, error: null });
    await createAward(client, { ...valid, slots: "" });
    expect(inserted(calls)).toMatchObject({ slots: null });
  });

  it.each([
    ["threshold", { threshold: "0" }],
    ["threshold", { kind: "percent", threshold: "101" }],
    ["threshold", { threshold: "1.5" }],
    ["slots", { slots: "0" }],
    ["slots", { slots: "muchos" }],
    ["kind", { kind: "puntos" }],
    ["title", { title: "a" }],
  ])("rejects a bad %s before reaching the database", async (field, patch) => {
    const { client, calls } = fakeClient();
    const result = await createAward(client, { ...valid, ...patch });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.[field]).toBeDefined();
    expect(calls).toEqual([]);
  });

  it("accepts a count above 100", async () => {
    const { client } = fakeClient({ data: null, error: null });
    const result = await createAward(client, {
      ...valid,
      kind: "count",
      threshold: "150",
    });
    expect(result.ok).toBe(true);
  });
});

describe("updateAward", () => {
  it("changes only the name and the description", async () => {
    const { client, calls } = fakeClient({
      data: [{ id: AWARD }],
      error: null,
    });
    const result = await updateAward(client, {
      awardId: AWARD,
      title: " Nuevo ",
      description: " Pasá por la mesa ",
      threshold: "1",
    });
    expect(result.ok).toBe(true);
    expect(calls.find((c) => c.method === "update")?.args[0]).toEqual({
      title: "Nuevo",
      description: "Pasá por la mesa",
    });
  });

  it("reads an award of another org as not allowed", async () => {
    const { client } = fakeClient({ data: [], error: null });
    const result = await updateAward(client, {
      awardId: AWARD,
      title: "Nuevo",
    });
    expect(result).toEqual({
      ok: false,
      error: "No tenés permiso para hacer esto.",
    });
  });
});

describe("deleteAward", () => {
  it("says so when someone already won it", async () => {
    const { client } = fakeClient({ data: null, error: { code: "23503" } });
    expect(await deleteAward(client, AWARD)).toEqual({
      ok: false,
      error: "Ya lo ganó alguien: no se puede quitar.",
    });
  });

  it("refuses what is not an id, and an award that is not the team's", async () => {
    const { client, calls } = fakeClient({ data: [], error: null });
    expect((await deleteAward(client, "x")).ok).toBe(false);
    expect(calls).toEqual([]);
    expect((await deleteAward(client, AWARD)).ok).toBe(false);
  });
});

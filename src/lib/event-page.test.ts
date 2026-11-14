import { describe, expect, it, vi } from "vitest";
import {
  addFaq,
  addPhoto,
  deleteFaq,
  deletePhoto,
  updateEventLinks,
  updateFaq,
} from "./event-page";
import { fakeClient, inserted } from "./fake-supabase";

const ORG = "0000000d-0000-4000-8000-000000000001";
const EVENT = "0000000d-0000-4000-8000-000000000002";
const ID = "0000000d-0000-4000-8000-000000000003";

describe("updateEventLinks", () => {
  it("saves the links trimmed and turns an empty one into null", async () => {
    const { client, calls } = fakeClient({
      data: [{ id: EVENT }],
      error: null,
    });
    const result = await updateEventLinks(client, {
      eventId: EVENT,
      description: " Tres jornadas. ",
      website: " https://expo.example ",
      instagram: "",
      tickets: "https://tickets.example/expo",
    });
    expect(result).toEqual({ ok: true, data: null });
    expect(calls.find((c) => c.method === "update")?.args[0]).toEqual({
      description: "Tres jornadas.",
      website_url: "https://expo.example",
      instagram_url: null,
      tickets_url: "https://tickets.example/expo",
      map_url: null,
    });
  });

  it.each([
    "javascript:alert(1)",
    "http://expo.example",
    "https://expo example",
    `https://${"a".repeat(300)}`,
  ])("rejects %j before reaching the database", async (website) => {
    const { client, calls } = fakeClient();
    const result = await updateEventLinks(client, { eventId: EVENT, website });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.website).toBeDefined();
    expect(calls).toEqual([]);
  });

  it("reads as no permission when RLS hides the event", async () => {
    const { client } = fakeClient({ data: [], error: null });
    expect(await updateEventLinks(client, { eventId: EVENT })).toEqual({
      ok: false,
      error: "No tenés permiso para hacer esto.",
    });
  });
});

describe("faqs", () => {
  it("adds a question trimmed, for the event and its org", async () => {
    const { client, calls } = fakeClient({ data: null, error: null });
    const result = await addFaq(client, {
      organizationId: ORG,
      eventId: EVENT,
      question: " ¿Hay estacionamiento? ",
      answer: " Sí, gratis. ",
    });
    expect(result.ok).toBe(true);
    expect(inserted(calls)).toEqual({
      organization_id: ORG,
      event_id: EVENT,
      question: "¿Hay estacionamiento?",
      answer: "Sí, gratis.",
    });
  });

  it("rejects a blank question and an over-long answer", async () => {
    const { client, calls } = fakeClient();
    const result = await addFaq(client, {
      organizationId: ORG,
      eventId: EVENT,
      question: "   ",
      answer: "x".repeat(601),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.question).toBeDefined();
      expect(result.fieldErrors?.answer).toBeDefined();
    }
    expect(calls).toEqual([]);
  });

  it("edits and deletes, and a hidden row reads as no permission", async () => {
    const hit = fakeClient(
      { data: [{ id: ID }], error: null },
      { data: [{ id: ID }], error: null },
    );
    expect(
      (await updateFaq(hit.client, { faqId: ID, question: "¿Q?", answer: "A" }))
        .ok,
    ).toBe(true);
    expect((await deleteFaq(hit.client, ID)).ok).toBe(true);

    const miss = fakeClient({ data: [], error: null });
    expect(await deleteFaq(miss.client, ID)).toMatchObject({ ok: false });
    expect(await deleteFaq(miss.client, "no-es-un-id")).toMatchObject({
      ok: false,
    });
  });
});

describe("photos", () => {
  const jpg = () => new File(["x"], "foto.jpg", { type: "image/jpeg" });

  function withStorage(...results: { data: unknown; error: unknown }[]) {
    const { client, calls } = fakeClient(...results);
    const upload = vi.fn(async (_path: string) => ({ error: null }));
    const remove = vi.fn(async (_paths: string[]) => ({ error: null }));
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

  it("uploads under the org's folder and saves the row", async () => {
    const { client, calls, upload } = withStorage({ data: null, error: null });
    const result = await addPhoto(client, {
      organizationId: ORG,
      eventId: EVENT,
      caption: " Entrada ",
      photo: jpg(),
    });
    expect(result.ok).toBe(true);
    const path = upload.mock.calls[0]?.[0];
    expect(path).toMatch(new RegExp(`^${ORG}/.+\\.jpg$`));
    expect(inserted(calls)).toEqual({
      organization_id: ORG,
      event_id: EVENT,
      path,
      caption: "Entrada",
    });
  });

  it("refuses an SVG or an oversized file before uploading", async () => {
    const { client, upload } = withStorage();
    const svg = new File(["<svg/>"], "x.svg", { type: "image/svg+xml" });
    const big = new File([new Uint8Array(1_572_865)], "x.png", {
      type: "image/png",
    });
    for (const photo of [svg, big]) {
      const r = await addPhoto(client, {
        organizationId: ORG,
        eventId: EVENT,
        photo,
      });
      expect(r.ok).toBe(false);
    }
    expect(upload).not.toHaveBeenCalled();
  });

  it("deletes the file again when the 13th photo is refused", async () => {
    const { client, upload, remove } = withStorage({
      data: null,
      error: { code: "23514", message: "an event holds at most 12 photos" },
    });
    const result = await addPhoto(client, {
      organizationId: ORG,
      eventId: EVENT,
      photo: jpg(),
    });
    expect(result).toMatchObject({ ok: false });
    expect(result.ok === false && result.error).toMatch(/hasta 12 fotos/);
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0]?.[0]]);
  });

  it("does not blame the cap for another refused check", async () => {
    const { client, remove } = withStorage({
      data: null,
      error: { code: "23514", message: "violates check constraint" },
    });
    const result = await addPhoto(client, {
      organizationId: ORG,
      eventId: EVENT,
      photo: jpg(),
    });
    expect(result.ok === false && result.error).not.toMatch(/12 fotos/);
    expect(remove).toHaveBeenCalled();
  });

  it("deletes the row, then its file", async () => {
    const { client, remove } = withStorage({
      data: [{ path: `${ORG}/a.jpg` }],
      error: null,
    });
    expect((await deletePhoto(client, ID)).ok).toBe(true);
    expect(remove).toHaveBeenCalledWith([`${ORG}/a.jpg`]);
  });

  it("keeps the file when the row was not the caller's", async () => {
    const { client, remove } = withStorage({ data: [], error: null });
    expect(await deletePhoto(client, ID)).toMatchObject({ ok: false });
    expect(remove).not.toHaveBeenCalled();
  });
});

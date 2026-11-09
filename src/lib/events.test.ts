import { describe, expect, it, vi } from "vitest";
import {
  addSchedule,
  createEvent,
  deleteSchedule,
  duplicateEvent,
  publishEvent,
  removeCover,
  uploadCover,
} from "./events";
import { fakeClient, inserted } from "./fake-supabase";

describe("duplicateEvent", () => {
  const valid = {
    organizationId: "0000000a-0000-4000-8000-000000000001",
    sourceId: "0000000a-0000-4000-8000-000000000002",
    title: " Fest ",
    slug: "Fest-Nov",
    venueId: "",
    editionLabel: "Noviembre",
    summary: "",
    timezone: "America/Argentina/Buenos_Aires",
  };

  it("normalizes the input and calls the database function", async () => {
    const { client, rpc } = fakeClient({ data: "fest-nov", error: null });
    expect(await duplicateEvent(client, valid)).toEqual({
      ok: true,
      data: { slug: "fest-nov" },
    });
    expect(rpc).toHaveBeenCalledWith("duplicate_event", {
      p_source_id: valid.sourceId,
      p_slug: "fest-nov",
      p_title: "Fest",
      p_timezone: valid.timezone,
      p_edition_label: "Noviembre",
      p_summary: undefined,
      p_venue_id: undefined,
    });
  });

  it("explains a slug already in use", async () => {
    const { client } = fakeClient({ data: null, error: { code: "23505" } });
    expect(await duplicateEvent(client, valid)).toEqual({
      ok: false,
      error: "Ya hay un evento con esa dirección en tu organización.",
    });
  });

  it("calls nothing without a source event", async () => {
    const { client, rpc } = fakeClient();
    const result = await duplicateEvent(client, { ...valid, sourceId: "x" });
    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});

const ORG = "0000000a-0000-4000-8000-000000000001";
const EVENT = "0000000a-0000-4000-8000-000000000002";

describe("createEvent", () => {
  const valid = {
    organizationId: ORG,
    title: " Expo 2026 ",
    slug: "Expo-2026",
    venueId: "",
    editionLabel: "",
    summary: "",
    timezone: "America/Argentina/Buenos_Aires",
  };

  it("normalizes the input and leaves empty fields as null", async () => {
    const { client, calls } = fakeClient({
      data: { id: EVENT, slug: "expo-2026" },
      error: null,
    });
    expect(await createEvent(client, valid)).toEqual({
      ok: true,
      data: { id: EVENT, slug: "expo-2026" },
    });
    expect(inserted(calls)).toEqual({
      organization_id: ORG,
      venue_id: null,
      slug: "expo-2026",
      title: "Expo 2026",
      edition_label: null,
      summary: null,
      timezone: "America/Argentina/Buenos_Aires",
    });
  });

  it("rejects an unknown time zone before reaching the database", async () => {
    const { client, calls } = fakeClient();
    const result = await createEvent(client, {
      ...valid,
      timezone: "Mars/Olympus",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.timezone).toBeDefined();
    expect(calls).toEqual([]);
  });

  it("explains a taken slug", async () => {
    const { client } = fakeClient({ data: null, error: { code: "23505" } });
    expect(await createEvent(client, valid)).toEqual({
      ok: false,
      error: "Ya hay un evento con esa dirección en tu organización.",
    });
  });
});

describe("addSchedule", () => {
  const valid = {
    eventId: EVENT,
    label: "Día 1",
    startsAt: "2026-11-14T10:00",
    endsAt: "2026-11-14T18:00",
  };

  it("stores the form's times as instants in the event's zone", async () => {
    const { client, calls } = fakeClient(
      {
        data: {
          organization_id: ORG,
          timezone: "America/Argentina/Buenos_Aires",
        },
        error: null,
      },
      { data: { id: "s1" }, error: null },
    );
    expect(await addSchedule(client, valid)).toEqual({
      ok: true,
      data: { id: "s1" },
    });
    expect(inserted(calls)).toEqual({
      event_id: EVENT,
      organization_id: ORG,
      label: "Día 1",
      starts_at: "2026-11-14T13:00:00.000Z",
      ends_at: "2026-11-14T21:00:00.000Z",
    });
  });

  it("rejects an end before the start on the end field", async () => {
    const { client, calls } = fakeClient();
    const result = await addSchedule(client, {
      ...valid,
      endsAt: "2026-11-14T09:00",
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.fieldErrors?.endsAt).toBe(
        "El fin tiene que ser después del inicio.",
      );
    expect(calls).toEqual([]);
  });

  it("says no permission when the event isn't visible", async () => {
    const { client } = fakeClient({ data: null, error: null });
    expect(await addSchedule(client, valid)).toEqual({
      ok: false,
      error: "No tenés permiso para hacer esto.",
    });
  });
});

describe("deleteSchedule", () => {
  it("says no permission when RLS deleted nothing", async () => {
    const { client } = fakeClient({ data: [], error: null });
    expect(await deleteSchedule(client, EVENT)).toEqual({
      ok: false,
      error: "No tenés permiso para hacer esto.",
    });
  });
});

describe("deleteSchedule on a published event", () => {
  it("explains that the last schedule must stay", async () => {
    const { client } = fakeClient({ data: null, error: { code: "23514" } });
    const result = await deleteSchedule(client, EVENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/al menos una jornada/);
  });
});

describe("publishEvent", () => {
  it("calls publish_event", async () => {
    const { client, rpc } = fakeClient({ data: null, error: null });
    expect(await publishEvent(client, EVENT)).toEqual({
      ok: true,
      data: null,
    });
    expect(rpc).toHaveBeenCalledWith("publish_event", { p_event_id: EVENT });
  });

  it("explains why an event can't be published", async () => {
    const { client } = fakeClient({ data: null, error: { code: "23514" } });
    expect(await publishEvent(client, EVENT)).toEqual({
      ok: false,
      error:
        "Para publicar, el evento tiene que ser un borrador con al menos una jornada.",
    });
  });
});

describe("event cover", () => {
  const ref = { organizationId: ORG, eventId: EVENT };
  const png = () => new File(["x"], "banner.png", { type: "image/png" });

  function withStorage(...results: { data: unknown; error: unknown }[]) {
    const { client } = fakeClient(...results);
    const upload = vi.fn(async (_path: string) => ({ error: null }));
    const remove = vi.fn(async () => ({ error: null }));
    return {
      client: {
        ...(client as object),
        storage: { from: () => ({ upload, remove }) },
      } as never,
      upload,
      remove,
    };
  }

  it("uploads under the org folder and deletes the previous file", async () => {
    const { client, upload, remove } = withStorage(
      { data: { cover_path: `${ORG}/old.png` }, error: null },
      { data: [{ id: EVENT }], error: null },
    );
    expect(await uploadCover(client, { ...ref, cover: png() })).toEqual({
      ok: true,
      data: null,
    });
    expect(upload.mock.calls[0]?.[0]).toMatch(new RegExp(`^${ORG}/.+\\.png$`));
    expect(remove).toHaveBeenCalledWith([`${ORG}/old.png`]);
  });

  it("deletes the new file if the event can't point to it", async () => {
    const { client, upload, remove } = withStorage(
      { data: { cover_path: null }, error: null },
      { data: [], error: null },
    );
    const result = await uploadCover(client, { ...ref, cover: png() });
    expect(result.ok).toBe(false);
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0]?.[0]]);
  });

  it("uploads nothing for an event of another org", async () => {
    const { client, upload } = withStorage({ data: null, error: null });
    const result = await uploadCover(client, { ...ref, cover: png() });
    expect(result.ok).toBe(false);
    expect(upload).not.toHaveBeenCalled();
  });

  it.each([
    ["an SVG", new File(["x"], "a.svg", { type: "image/svg+xml" })],
    [
      "a file over 1.5 MB",
      new File([new Uint8Array(1_572_865)], "a.png", { type: "image/png" }),
    ],
    ["no file", null],
  ])("rejects %s before uploading", async (_label, cover) => {
    const { client, upload } = withStorage();
    const result = await uploadCover(client, { ...ref, cover });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.cover).toBeTruthy();
    expect(upload).not.toHaveBeenCalled();
  });

  it("removing clears the event and deletes the file", async () => {
    const { client, remove } = withStorage(
      { data: { cover_path: `${ORG}/old.png` }, error: null },
      { data: [{ id: EVENT }], error: null },
    );
    expect(await removeCover(client, ref)).toEqual({ ok: true, data: null });
    expect(remove).toHaveBeenCalledWith([`${ORG}/old.png`]);
  });
});

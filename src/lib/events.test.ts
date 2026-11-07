import { describe, expect, it, vi } from "vitest";
import {
  addSchedule,
  createEvent,
  deleteSchedule,
  publishEvent,
} from "./events";

const ORG = "0000000a-0000-4000-8000-000000000001";
const EVENT = "0000000a-0000-4000-8000-000000000002";

/**
 * Stand-in for the Supabase client. Every query chain resolves to the next
 * queued result, and records the calls so the test can see what was written.
 */
function fakeClient(...results: { data: unknown; error: unknown }[]) {
  const calls: { method: string; args: unknown[] }[] = [];
  const chain: Record<string, unknown> = {};
  for (const method of [
    "from",
    "insert",
    "delete",
    "select",
    "eq",
    "single",
    "maybeSingle",
  ]) {
    chain[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return chain;
    };
  }
  // biome-ignore lint/suspicious/noThenProperty: the fake must be awaitable like the real query builder.
  chain.then = (resolve: (v: unknown) => void) => resolve(results.shift());
  const rpc = vi.fn(async () => results.shift());
  return { client: { ...chain, rpc } as never, calls, rpc };
}

const inserted = (calls: { method: string; args: unknown[] }[]) =>
  calls.find((c) => c.method === "insert")?.args[0];

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

import { describe, expect, it } from "vitest";
import { fakeClient } from "../fake-supabase";
import {
  getEventOverview,
  getOrgOverview,
  listActivity,
  listSpotRanking,
} from "./overview";

const ok = (data: unknown) => ({ data, error: null });
const failed = { data: null, error: new Error("denied") };

describe("getEventOverview", () => {
  it("asks for the event and names the figures", async () => {
    const { client, rpc } = fakeClient(
      ok([
        {
          visitors: 3,
          half: 2,
          complete: 0,
          medals: 7,
          stands: 4,
          idle_stands: 1,
        },
      ]),
    );

    expect(await getEventOverview(client, "ev-1")).toEqual({
      visitors: 3,
      half: 2,
      complete: 0,
      medals: 7,
      stands: 4,
      idleStands: 1,
    });
    expect(rpc).toHaveBeenCalledWith("event_overview", { p_event_id: "ev-1" });
  });

  it("gives zeros when there is no row", async () => {
    const overview = await getEventOverview(fakeClient(ok([])).client, "ev-1");
    expect(Object.values(overview).every((n) => n === 0)).toBe(true);
  });

  it("throws when the read fails, so the caller decides what to show", async () => {
    await expect(
      getEventOverview(fakeClient(failed).client, "ev-1"),
    ).rejects.toThrow("denied");
  });
});

describe("listSpotRanking", () => {
  it("names each stand's fields", async () => {
    const { client } = fakeClient(
      ok([
        {
          event_spot_id: "es-1",
          code: "A1",
          name: "Café",
          is_active: false,
          medals: 2,
        },
      ]),
    );
    expect(await listSpotRanking(client, "ev-1")).toEqual([
      { id: "es-1", code: "A1", name: "Café", active: false, medals: 2 },
    ]);
  });
});

describe("getOrgOverview", () => {
  it("gives the visitors and the returning ones, or zeros", async () => {
    const { client, rpc } = fakeClient(ok([{ visitors: 3, returned: 1 }]));
    expect(await getOrgOverview(client, "org-1")).toEqual({
      visitors: 3,
      returned: 1,
    });
    expect(rpc).toHaveBeenCalledWith("org_overview", {
      p_organization_id: "org-1",
    });
    expect(await getOrgOverview(fakeClient(ok([])).client, "org-1")).toEqual({
      visitors: 0,
      returned: 0,
    });
  });
});

describe("listActivity", () => {
  const row = {
    happened_at: "2026-11-14T15:30:00Z",
    kind: "sorteo",
    event_id: "ev-1",
    user_id: "u-1",
    visitor: "Ana García",
    detail: "Remera",
    is_first: false,
  };

  it("passes the event and the limit, and names the fields", async () => {
    const { client, rpc } = fakeClient(ok([row]));

    expect(
      await listActivity(client, "org-1", { eventId: "ev-1", limit: 5 }),
    ).toEqual([
      {
        kind: "sorteo",
        at: row.happened_at,
        eventId: "ev-1",
        userId: "u-1",
        visitor: "Ana García",
        detail: "Remera",
        first: false,
      },
    ]);
    expect(rpc).toHaveBeenCalledWith("org_activity", {
      p_organization_id: "org-1",
      p_event_id: "ev-1",
      p_limit: 5,
    });
  });

  it("leaves out a kind it does not know", async () => {
    const { client } = fakeClient(ok([{ ...row, kind: "registro" }]));
    expect(await listActivity(client, "org-1")).toEqual([]);
  });
});

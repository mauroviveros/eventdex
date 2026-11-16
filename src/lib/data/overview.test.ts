import { describe, expect, it } from "vitest";
import { fakeClient } from "../fake-supabase";
import {
  getEventOverview,
  getOrgOverview,
  listActivity,
  listActivityPage,
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
    id: "00000000-0000-0000-0000-00000000e301",
  };

  it("passes the event and the limit, and names the fields", async () => {
    const { client, rpc } = fakeClient(ok([row]));

    expect(
      await listActivity(client, "org-1", { eventId: "ev-1", limit: 5 }),
    ).toEqual([
      {
        kind: "sorteo",
        id: row.id,
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

describe("listActivityPage", () => {
  const row = (n: number) => ({
    id: `00000000-0000-0000-0000-00000000e10${n}`,
    happened_at: `2026-11-14T20:0${n}:00.123456+00:00`,
    kind: "medalla",
    event_id: "ev-1",
    user_id: "u-1",
    visitor: "Ana García",
    detail: "Café",
    is_first: false,
  });

  it("asks for one row more and points the next page at the last one shown", async () => {
    const { client, rpc } = fakeClient(ok([row(3), row(2), row(1)]));

    const page = await listActivityPage(client, "org-1", { size: 2 });

    expect(page.items.map((a) => a.id)).toEqual([row(3).id, row(2).id]);
    expect(page.next).toBe(`${row(2).happened_at}_${row(2).id}`);
    expect(rpc).toHaveBeenCalledWith(
      "org_activity",
      expect.objectContaining({ p_organization_id: "org-1", p_limit: 3 }),
    );
  });

  it("has no next page when the extra row does not come", async () => {
    const page = await listActivityPage(
      fakeClient(ok([row(2), row(1)])).client,
      "org-1",
      { size: 2 },
    );
    expect(page.items).toHaveLength(2);
    expect(page.next).toBeNull();
  });

  it("passes the event, the kind and the cursor", async () => {
    const { client, rpc } = fakeClient(ok([]));

    await listActivityPage(client, "org-1", {
      eventId: "ev-1",
      kind: "premio",
      before: { at: row(1).happened_at, id: row(1).id },
    });

    expect(rpc).toHaveBeenCalledWith("org_activity", {
      p_organization_id: "org-1",
      p_event_id: "ev-1",
      p_limit: 31,
      p_kind: "premio",
      p_before_at: row(1).happened_at,
      p_before_id: row(1).id,
    });
  });
});

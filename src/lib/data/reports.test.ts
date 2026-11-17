import { describe, expect, it } from "vitest";
import { fakeClient } from "../fake-supabase";
import { getSpotReport, listPrizeOutcomes, listSpotHours } from "./reports";

const ok = (data: unknown) => ({ data, error: null });
const failed = { data: null, error: new Error("denied") };

describe("getSpotReport", () => {
  it("names the figures and keeps the average a number", async () => {
    const { client, rpc } = fakeClient(
      ok([
        {
          event_id: "ev-1",
          visits: 3,
          first_stops: 2,
          rank: 1,
          stands: 3,
          average: "2.7",
        },
      ]),
    );

    expect(await getSpotReport(client, "es-1")).toEqual({
      eventId: "ev-1",
      visits: 3,
      firstStops: 2,
      rank: 1,
      stands: 3,
      average: 2.7,
    });
    expect(rpc).toHaveBeenCalledWith("spot_report", {
      p_event_spot_id: "es-1",
    });
  });

  it("leaves the place null for an inactive stand", async () => {
    const { client } = fakeClient(
      ok([
        {
          event_id: "ev-1",
          visits: 0,
          first_stops: 0,
          rank: null,
          stands: 3,
          average: null,
        },
      ]),
    );
    expect(await getSpotReport(client, "es-4")).toMatchObject({
      rank: null,
      average: 0,
    });
  });

  it("is null when the stand is not readable", async () => {
    expect(await getSpotReport(fakeClient(ok([])).client, "es-9")).toBeNull();
  });

  it("throws when the read fails, so the caller decides what to show", async () => {
    await expect(
      getSpotReport(fakeClient(failed).client, "es-1"),
    ).rejects.toThrow("denied");
  });
});

describe("listSpotHours", () => {
  it("gives the hours in the shape of the event's, without newcomers", async () => {
    const { client } = fakeClient(
      ok([{ hour: "2026-11-14T13:00:00+00:00", medals: 4 }]),
    );
    expect(await listSpotHours(client, "es-1")).toEqual([
      { hour: "2026-11-14T13:00:00+00:00", medals: 4, newcomers: 0 },
    ]);
  });
});

describe("listPrizeOutcomes", () => {
  it("names each prize and draw, and drops a kind it does not know", async () => {
    const row = {
      id: "p-1",
      title: "Todas",
      needed: 3,
      slots: 1,
      winners: 1,
      reached: 4,
    };
    const { client } = fakeClient(
      ok([
        { ...row, kind: "premio" },
        { ...row, id: "p-2", kind: "otro" },
      ]),
    );
    expect(await listPrizeOutcomes(client, "ev-1")).toEqual([
      { ...row, kind: "premio" },
    ]);
  });
});

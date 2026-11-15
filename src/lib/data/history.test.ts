import { describe, expect, it } from "vitest";
import { fakeClient } from "../fake-supabase";
import { getMyHistory } from "./history";

const NOW = new Date("2026-11-14T12:00:00Z");
const ok = (data: unknown) => ({ data, error: null });
const event = (id: string, startsAt: string | null, spots = 5) => ({
  id,
  slug: `expo-${id}`,
  title: "Expo",
  edition_label: id,
  schedules: startsAt ? [{ starts_at: startsAt }] : [],
  spots: [{ count: spots }],
});

describe("getMyHistory", () => {
  it("counts medals and wins per edition and leaves out editions not started", async () => {
    const { client } = fakeClient(
      ok([
        event("a", "2025-10-01T12:00:00Z"),
        event("b", "2026-10-01T12:00:00Z"),
        event("future", "2027-01-01T12:00:00Z"),
        event("undated", null),
      ]),
      ok([{ event_id: "a" }, { event_id: "a" }, { event_id: "future" }]),
      ok([{ raffle: { event_id: "a" } }]),
    );

    const history = await getMyHistory(client, "org", "me", NOW);

    expect(history.played).toHaveLength(1);
    expect(history.played[0]?.slug).toBe("expo-a");
    expect(history.played[0]).toMatchObject({ id: "a", medals: 2, wins: 1 });
    expect(history.totals).toEqual({ events: 1, medals: 2, wins: 1 });
  });

  it("never counts more medals than the event's active stands", async () => {
    const { client } = fakeClient(
      ok([event("a", "2025-10-01T12:00:00Z", 2)]),
      ok([{ event_id: "a" }, { event_id: "a" }, { event_id: "a" }]),
      ok([]),
    );

    const history = await getMyHistory(client, "org", "me", NOW);

    expect(history.played[0]).toMatchObject({ medals: 2, total: 2 });
  });

  it("throws when a read fails", async () => {
    const { client } = fakeClient(
      ok([]),
      { data: null, error: new Error("boom") },
      ok([]),
    );

    await expect(getMyHistory(client, "org", "me", NOW)).rejects.toThrow(
      "boom",
    );
  });
});

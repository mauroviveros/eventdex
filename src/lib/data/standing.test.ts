import { describe, expect, it } from "vitest";
import { fakeClient } from "../fake-supabase";
import { getRaffleHref, readStanding } from "./standing";

const ok = (data: unknown) => ({ data, error: null });
const failed = { data: null, error: new Error("denied") };

describe("readStanding", () => {
  it("gives the role in the team and the first registration", async () => {
    const { client } = fakeClient(
      ok({ role: "owner" }),
      ok([{ created_at: "2026-03-29T12:00:00Z" }]),
    );

    expect(await readStanding(client, "org", "me")).toEqual({
      role: "owner",
      since: "2026-03-29T12:00:00Z",
    });
  });

  it("is a plain visitor without a row in the team, and new without registrations", async () => {
    const { client } = fakeClient(ok(null), ok([]));

    expect(await readStanding(client, "org", "me")).toEqual({
      role: null,
      since: null,
    });
  });

  it("filters both reads by this organization and this user", async () => {
    const { client, calls } = fakeClient(ok(null), ok([]));

    await readStanding(client, "org-1", "user-1");

    const eqs = calls.filter((c) => c.method === "eq").map((c) => c.args);
    expect(eqs).toContainEqual(["organization_id", "org-1"]);
    expect(eqs.filter((a) => a[0] === "user_id")).toEqual([
      ["user_id", "user-1"],
      ["user_id", "user-1"],
    ]);
  });

  it("throws when a read fails, so the page decides what to show", async () => {
    await expect(
      readStanding(fakeClient(failed, ok([])).client, "org", "me"),
    ).rejects.toThrow("denied");
    await expect(
      readStanding(fakeClient(ok(null), failed).client, "org", "me"),
    ).rejects.toThrow("denied");
  });
});

describe("getRaffleHref", () => {
  const org = { id: "org", slug: "expo" };

  it("links to the raffle tab of the active event, on the root domain", async () => {
    const { client, rpc } = fakeClient(ok({ slug: "expo-primavera" }));

    expect(await getRaffleHref(client, org, "eventdex.com")).toBe(
      "https://eventdex.com/panel/expo/eventos/expo-primavera?tab=sorteo",
    );
    expect(rpc).toHaveBeenCalledWith("active_event", {
      p_organization_id: "org",
    });
  });

  it("has no link when the organization has no active event", async () => {
    const { client } = fakeClient(ok(null));

    expect(await getRaffleHref(client, org, "eventdex.com")).toBeNull();
  });

  it("throws when the read fails", async () => {
    await expect(
      getRaffleHref(fakeClient(failed).client, org, "eventdex.com"),
    ).rejects.toThrow("denied");
  });
});

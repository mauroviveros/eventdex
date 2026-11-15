import { describe, expect, it } from "vitest";
import { fakeClient } from "../fake-supabase";
import { getRaffleHref, readRole, readSince } from "./standing";

const ok = (data: unknown) => ({ data, error: null });
const failed = { data: null, error: new Error("denied") };

describe("readRole", () => {
  it("gives the role in the team, or null for a plain visitor", async () => {
    expect(
      await readRole(fakeClient(ok({ role: "owner" })).client, "o", "u"),
    ).toBe("owner");
    expect(await readRole(fakeClient(ok(null)).client, "o", "u")).toBeNull();
  });

  it("filters by this organization and this user", async () => {
    const { client, calls } = fakeClient(ok(null));

    await readRole(client, "org-1", "user-1");

    const eqs = calls.filter((c) => c.method === "eq").map((c) => c.args);
    expect(eqs).toEqual([
      ["organization_id", "org-1"],
      ["user_id", "user-1"],
    ]);
  });

  it("throws when the read fails, so the caller decides what to show", async () => {
    await expect(readRole(fakeClient(failed).client, "o", "u")).rejects.toThrow(
      "denied",
    );
  });
});

describe("readSince", () => {
  it("gives the first registration, or null for someone who never registered", async () => {
    expect(
      await readSince(
        fakeClient(ok([{ created_at: "2026-03-29T12:00:00Z" }])).client,
        "o",
        "u",
      ),
    ).toBe("2026-03-29T12:00:00Z");
    expect(await readSince(fakeClient(ok([])).client, "o", "u")).toBeNull();
  });

  it("asks for the earliest one, of this organization and this user", async () => {
    const { client, calls } = fakeClient(ok([]));

    await readSince(client, "org-1", "user-1");

    const eqs = calls.filter((c) => c.method === "eq").map((c) => c.args);
    expect(eqs).toEqual([
      ["organization_id", "org-1"],
      ["user_id", "user-1"],
    ]);
    expect(calls.find((c) => c.method === "order")?.args).toEqual([
      "created_at",
    ]);
    expect(calls.find((c) => c.method === "limit")?.args).toEqual([1]);
  });

  it("throws when the read fails", async () => {
    await expect(
      readSince(fakeClient(failed).client, "o", "u"),
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

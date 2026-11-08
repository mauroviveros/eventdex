import { describe, expect, it } from "vitest";
import { fakeClient } from "./fake-supabase";
import { changeMemberRole, inviteMember, removeMember } from "./team";

const ORG = "0000000a-0000-4000-8000-000000000001";
const ID = "0000000a-0000-4000-8000-000000000002";

describe("inviteMember", () => {
  it("normalizes the mail and calls the database function", async () => {
    const { client, rpc } = fakeClient({ data: "inv", error: null });
    const result = await inviteMember(client, {
      organizationId: ORG,
      email: " Ana@Expo.com ",
      role: "staff",
    });
    expect(result).toEqual({ ok: true, data: { id: "inv" } });
    expect(rpc).toHaveBeenCalledWith("invite_member", {
      p_organization_id: ORG,
      p_email: "ana@expo.com",
      p_role: "staff",
    });
  });

  it("rejects a bad mail or role before the database", async () => {
    const { client, rpc } = fakeClient();
    const result = await inviteMember(client, {
      organizationId: ORG,
      email: "no-es-mail",
      role: "rey",
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual([
        "email",
        "role",
      ]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("explains someone already on the team", async () => {
    const { client } = fakeClient({ data: null, error: { code: "23505" } });
    expect(
      await inviteMember(client, {
        organizationId: ORG,
        email: "a@b.com",
        role: "staff",
      }),
    ).toEqual({
      ok: false,
      error:
        "Esa persona ya es parte del equipo o tiene una invitación abierta.",
    });
  });
});

describe("the last owner", () => {
  const lastOwner = { data: null, error: { code: "23514" } };
  const error = "La organización tiene que conservar al menos un owner.";

  it("cannot be demoted", async () => {
    const { client } = fakeClient(lastOwner);
    expect(await changeMemberRole(client, { id: ID, role: "staff" })).toEqual({
      ok: false,
      error,
    });
  });

  it("cannot be removed", async () => {
    const { client } = fakeClient(lastOwner);
    expect(await removeMember(client, ID)).toEqual({ ok: false, error });
  });
});

it("a write RLS filtered out is a permission error, not a success", async () => {
  const { client } = fakeClient({ data: [], error: null });
  expect(await changeMemberRole(client, { id: ID, role: "owner" })).toEqual({
    ok: false,
    error: "No tenés permiso para hacer esto.",
  });
});

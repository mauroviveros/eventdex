import { describe, expect, it, vi } from "vitest";
import { createOrganization } from "./organizations";

// Stand-in for the Supabase client: only rpc, returning what the database would.
function fakeRpc(result: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as never, rpc };
}

const valid = {
  name: "  Expo de Ejemplo ",
  slug: "Expo-Ejemplo",
  hostname: "Expo.com.ar",
  ownerEmail: " Owner@Expo.com.ar ",
};

describe("createOrganization", () => {
  it("normalizes the input and calls the database function", async () => {
    const { client, rpc } = fakeRpc({ data: "org-id", error: null });
    const result = await createOrganization(client, valid);
    expect(result).toEqual({ ok: true, data: { id: "org-id" } });
    expect(rpc).toHaveBeenCalledWith("create_organization", {
      p_name: "Expo de Ejemplo",
      p_slug: "expo-ejemplo",
      p_hostname: "expo.com.ar",
      p_owner_email: "owner@expo.com.ar",
    });
  });

  it("returns field errors and never reaches the database on bad input", async () => {
    const { client, rpc } = fakeRpc({ data: null, error: null });
    const result = await createOrganization(client, {
      name: "X",
      slug: "con espacios",
      hostname: "https://expo.com.ar/",
      ownerEmail: "no-es-mail",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual([
        "hostname",
        "name",
        "ownerEmail",
        "slug",
      ]);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("explains a missing permission without technical detail", async () => {
    const { client } = fakeRpc({
      data: null,
      error: {
        code: "42501",
        message: "Solo el developer puede crear organizaciones",
      },
    });
    expect(await createOrganization(client, valid)).toEqual({
      ok: false,
      error: "No tenés permiso para hacer esto.",
    });
  });

  it("explains a taken slug or domain", async () => {
    const { client } = fakeRpc({ data: null, error: { code: "23505" } });
    const result = await createOrganization(client, valid);
    expect(result).toEqual({
      ok: false,
      error: "Ya existe una organización con ese slug o con ese dominio.",
    });
  });

  it("falls back to a generic message on unknown errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeRpc({ data: null, error: { code: "XX000" } });
    const result = await createOrganization(client, valid);
    expect(result).toEqual({
      ok: false,
      error: "No pudimos guardar. Probá de nuevo en un rato.",
    });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

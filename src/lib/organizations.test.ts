import { describe, expect, it, vi } from "vitest";
import { fakeClient } from "./fake-supabase";
import {
  assignDomain,
  createOrganization,
  removeDomain,
  updateSettings,
  uploadLogo,
} from "./organizations";

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

const ORG = "0000000a-0000-4000-8000-000000000001";

describe("updateSettings", () => {
  const input = {
    organizationId: ORG,
    name: "Expo",
    brandColor: "#808080",
    defaultTimezone: "America/Argentina/Buenos_Aires",
  };

  it("accepts any valid color: the ramp guarantees the contrast", async () => {
    const { client, calls } = fakeClient({ data: [{ id: ORG }], error: null });
    expect(await updateSettings(client, input)).toEqual({
      ok: true,
      data: null,
    });
    expect(calls.find((c) => c.method === "update")?.args[0]).toMatchObject({
      brand_color: "#808080",
    });
  });

  it("rejects an invalid color or time zone with a message per field", async () => {
    const { client } = fakeClient();
    const result = await updateSettings(client, {
      ...input,
      brandColor: "verde",
      defaultTimezone: "Marte/Olympus",
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual([
        "brandColor",
        "defaultTimezone",
      ]);
  });
});

describe("uploadLogo", () => {
  const png = () => new File(["x"], "logo.png", { type: "image/png" });

  function withStorage(
    results: { data: unknown; error: unknown }[],
    uploadError: unknown = null,
  ) {
    const { client } = fakeClient(...results);
    const upload = vi.fn(async (_path: string) => ({ error: uploadError }));
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
    const { client, upload, remove } = withStorage([
      { data: { logo_path: `${ORG}/old.png` }, error: null },
      { data: [{ id: ORG }], error: null },
    ]);
    expect(
      await uploadLogo(client, { organizationId: ORG, logo: png() }),
    ).toEqual({ ok: true, data: null });
    expect(upload.mock.calls[0]?.[0]).toMatch(new RegExp(`^${ORG}/.+\\.png$`));
    expect(remove).toHaveBeenCalledWith([`${ORG}/old.png`]);
  });

  it("deletes the new file if the org can't point to it", async () => {
    const { client, upload, remove } = withStorage([
      { data: { logo_path: null }, error: null },
      { data: [], error: null },
    ]);
    const result = await uploadLogo(client, {
      organizationId: ORG,
      logo: png(),
    });
    expect(result.ok).toBe(false);
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0]?.[0]]);
  });

  it.each([
    ["an SVG", new File(["x"], "a.svg", { type: "image/svg+xml" })],
    [
      "a file over 1 MB",
      new File([new Uint8Array(1024 * 1024 + 1)], "a.png", {
        type: "image/png",
      }),
    ],
    ["no file", null],
  ])("rejects %s before uploading", async (_label, logo) => {
    const { client, upload } = withStorage([]);
    const result = await uploadLogo(client, { organizationId: ORG, logo });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.logo).toBeTruthy();
    expect(upload).not.toHaveBeenCalled();
  });
});

describe("domains", () => {
  const domain = { organizationId: ORG, hostname: "Expo.com.ar" };

  it("normalizes the hostname and reads the buttons pressed", async () => {
    const { client, rpc } = fakeRpc({ data: null, error: null });
    expect(
      await assignDomain(client, { ...domain, makePrimary: "on" }),
    ).toEqual({ ok: true, data: { conflict: null } });
    expect(rpc).toHaveBeenCalledWith("assign_domain", {
      p_organization_id: ORG,
      p_hostname: "expo.com.ar",
      p_make_primary: true,
      p_transfer: false,
    });
  });

  it("names the org that already has the domain", async () => {
    const { client } = fakeRpc({ data: "Otra Org", error: null });
    expect(await assignDomain(client, domain)).toEqual({
      ok: true,
      data: { conflict: "Otra Org" },
    });
  });

  it("explains a domain the org already has", async () => {
    const { client } = fakeRpc({ data: null, error: { code: "23505" } });
    expect(await assignDomain(client, domain)).toEqual({
      ok: false,
      error: "Esta organización ya tiene ese dominio.",
    });
  });

  it("explains why an org's only domain cannot move", async () => {
    const { client } = fakeRpc({ data: null, error: { code: "23514" } });
    const result = await assignDomain(client, { ...domain, transfer: "on" });
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining("único dominio"),
    });
  });

  it("rejects a hostname with a scheme before calling the database", async () => {
    const { client, rpc } = fakeRpc({ data: null, error: null });
    const result = await assignDomain(client, {
      ...domain,
      hostname: "https://mal/",
    });
    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not remove the primary one", async () => {
    const { client, calls } = fakeClient({ data: [], error: null });
    const result = await removeDomain(client, ORG);
    expect(result.ok).toBe(false);
    expect(calls).toContainEqual({ method: "eq", args: ["is_primary", false] });
  });
});

import { describe, expect, it } from "vitest";
import { Constants } from "@/lib/supabase/database.types";
import {
  publicOrigin,
  resolvePublishedSpot,
  resolveSpot,
  SPOT_TYPES,
  spotUrl,
} from "./spots";

const catalog = {
  name: "Café Nuevo",
  description: "Renovado en 2027",
  logo_path: "logos/nuevo.png",
  type: "stand" as const,
};

const snapshot = {
  name: "Café de la Esquina",
  description: "El de siempre",
  logo_path: "logos/viejo.png",
  type: "sponsor",
  frozen_at: "2026-11-01T00:00:00Z",
};

const none = { name_override: null, description_override: null };

describe("resolveSpot", () => {
  it("uses the catalog while the event is a draft (no snapshot)", () => {
    expect(resolveSpot({ ...none, snapshot: null }, catalog)).toEqual({
      name: "Café Nuevo",
      description: "Renovado en 2027",
      logoPath: "logos/nuevo.png",
      type: "stand",
    });
  });

  it("uses the snapshot once published, whatever the catalog says now", () => {
    expect(resolveSpot({ ...none, snapshot }, catalog)).toEqual({
      name: "Café de la Esquina",
      description: "El de siempre",
      logoPath: "logos/viejo.png",
      type: "sponsor",
    });
  });

  it("lets the edition's override win over the snapshot and the catalog", () => {
    const resolved = resolveSpot(
      {
        name_override: "Café · Pabellón A",
        description_override: "Solo esta edición",
        snapshot,
      },
      catalog,
    );
    expect(resolved.name).toBe("Café · Pabellón A");
    expect(resolved.description).toBe("Solo esta edición");
    // Logo and type have no override: they come from the snapshot.
    expect(resolved.logoPath).toBe("logos/viejo.png");
    expect(resolved.type).toBe("sponsor");
  });

  it("keeps a frozen empty description instead of falling back to the catalog", () => {
    const resolved = resolveSpot(
      { ...none, snapshot: { ...snapshot, description: null } },
      catalog,
    );
    expect(resolved.description).toBeNull();
  });

  it("falls back to the catalog when the snapshot is malformed", () => {
    const resolved = resolveSpot(
      { ...none, snapshot: { name: 42, type: "kiosco" } },
      catalog,
    );
    expect(resolved.name).toBe("Café Nuevo");
    expect(resolved.type).toBe("stand");
  });
});

describe("spotUrl", () => {
  it("points at /s/[id] on the org's domain, over https", () => {
    expect(spotUrl("expo.com.ar", "abc")).toBe("https://expo.com.ar/s/abc");
  });

  it("uses http for local development hosts", () => {
    expect(spotUrl("expo.localhost:3000", "abc")).toBe(
      "http://expo.localhost:3000/s/abc",
    );
  });
});

describe("SPOT_TYPES", () => {
  // The domain doesn't import Supabase; this keeps it in step with the enum.
  it("matches the database's spot_type enum", () => {
    expect([...SPOT_TYPES]).toEqual([...Constants.public.Enums.spot_type]);
  });
});

describe("publicOrigin", () => {
  it("is https in production and http on local hosts", () => {
    expect(publicOrigin("expo.com.ar")).toBe("https://expo.com.ar");
    expect(publicOrigin("expo.localhost:3000")).toBe(
      "http://expo.localhost:3000",
    );
    // A real domain that merely contains "localhost" is not local.
    expect(publicOrigin("notlocalhost.com")).toBe("https://notlocalhost.com");
  });
});

describe("resolvePublishedSpot", () => {
  it("shows the snapshot, or the edition's override", () => {
    expect(resolvePublishedSpot({ ...none, snapshot })?.name).toBe(
      "Café de la Esquina",
    );
    expect(
      resolvePublishedSpot({
        ...none,
        name_override: "Café · Hall",
        snapshot,
      })?.name,
    ).toBe("Café · Hall");
  });

  it("leaves out a spot without a readable snapshot", () => {
    expect(resolvePublishedSpot({ ...none, snapshot: null })).toBeNull();
  });
});

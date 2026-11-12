import { describe, expect, it } from "vitest";
import { internalPath, surfaceFor } from "./surface";

describe("surfaceFor", () => {
  const root = "localhost:3000";
  const admin = "app.localhost:3000";

  it("serves the landing on the root domain and www", () => {
    expect(surfaceFor("localhost:3000", root, admin)).toEqual({
      kind: "landing",
    });
    expect(surfaceFor("www.localhost:3000", root, admin)).toEqual({
      kind: "landing",
    });
  });

  it("serves the admin on the app subdomain", () => {
    expect(surfaceFor("app.localhost:3000", root, admin)).toEqual({
      kind: "admin",
    });
  });

  it("serves the admin on its own host when the root has no subdomains", () => {
    const root = "eventdex.vercel.app";
    const admin = "eventdex-admin.vercel.app";
    expect(surfaceFor("eventdex.vercel.app", root, admin).kind).toBe("landing");
    expect(surfaceFor("Eventdex-Admin.vercel.app", root, admin).kind).toBe(
      "admin",
    );
    expect(surfaceFor("evento.lodecharlytcg.com", root, admin)).toEqual({
      kind: "publica",
      host: "evento.lodecharlytcg.com",
    });
  });

  it("serves the landing on Vercel's deployment and branch URLs only", () => {
    const root = "eventdex.vercel.app";
    const admin = "eventdex-admin.vercel.app";
    const deployment = [
      "eventdex-1bqgspuqb-mauroviveros.vercel.app",
      "eventdex-git-main-mauroviveros.vercel.app",
      undefined,
    ];
    expect(
      surfaceFor(
        "eventdex-1bqgspuqb-mauroviveros.vercel.app",
        root,
        admin,
        deployment,
      ).kind,
    ).toBe("landing");
    expect(
      surfaceFor(
        "eventdex-git-main-mauroviveros.vercel.app",
        root,
        admin,
        deployment,
      ).kind,
    ).toBe("landing");
    expect(
      surfaceFor("eventdex-demo.vercel.app", root, admin, deployment),
    ).toEqual({ kind: "publica", host: "eventdex-demo.vercel.app" });
  });

  it("treats any other host as an organization domain", () => {
    expect(surfaceFor("expo.localhost:3000", root, admin)).toEqual({
      kind: "publica",
      host: "expo.localhost:3000",
    });
    expect(
      surfaceFor("ExpoUbbe.com", "eventdex.com", "app.eventdex.com"),
    ).toEqual({
      kind: "publica",
      host: "expoubbe.com",
    });
  });

  it("does not confuse a lookalike domain with the root", () => {
    expect(
      surfaceFor("app.eventdex.com.evil.io", "eventdex.com", "app.eventdex.com")
        .kind,
    ).toBe("publica");
  });
});

describe("internalPath", () => {
  it("prefixes the surface folder", () => {
    expect(internalPath({ kind: "landing" }, "/")).toBe("/landing");
    expect(internalPath({ kind: "admin" }, "/plataforma")).toBe(
      "/admin/plataforma",
    );
  });

  it("keeps the host as a single encoded segment", () => {
    expect(
      internalPath({ kind: "publica", host: "expo.localhost:3000" }, "/s/abc"),
    ).toBe("/publica/expo.localhost%3A3000/s/abc");
  });
});

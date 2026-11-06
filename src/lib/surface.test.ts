import { describe, expect, it } from "vitest";
import { internalPath, surfaceFor } from "./surface";

describe("surfaceFor", () => {
  const root = "localhost:3000";

  it("serves the landing on the root domain and www", () => {
    expect(surfaceFor("localhost:3000", root)).toEqual({ kind: "landing" });
    expect(surfaceFor("www.localhost:3000", root)).toEqual({ kind: "landing" });
  });

  it("serves the admin on the app subdomain", () => {
    expect(surfaceFor("app.localhost:3000", root)).toEqual({ kind: "admin" });
  });

  it("treats any other host as an organization domain", () => {
    expect(surfaceFor("expo.localhost:3000", root)).toEqual({
      kind: "publica",
      host: "expo.localhost:3000",
    });
    expect(surfaceFor("ExpoUbbe.com", "eventdex.com")).toEqual({
      kind: "publica",
      host: "expoubbe.com",
    });
  });

  it("does not confuse a lookalike domain with the root", () => {
    expect(surfaceFor("app.eventdex.com.evil.io", "eventdex.com").kind).toBe(
      "publica",
    );
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

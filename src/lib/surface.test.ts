import { describe, expect, it } from "vitest";
import { internalPath, surfaceFor } from "./surface";

describe("surfaceFor", () => {
  const root = "localhost:3000";

  it("serves the landing and the panel on the root domain and www", () => {
    expect(surfaceFor("localhost:3000", root)).toEqual({ kind: "landing" });
    expect(surfaceFor("www.localhost:3000", root)).toEqual({ kind: "landing" });
  });

  it("serves the root on Vercel's deployment and branch URLs only", () => {
    const root = "eventdex.vercel.app";
    const deployment = [
      "eventdex-1bqgspuqb-mauroviveros.vercel.app",
      "eventdex-git-main-mauroviveros.vercel.app",
      undefined,
    ];
    expect(
      surfaceFor("eventdex-1bqgspuqb-mauroviveros.vercel.app", root, deployment)
        .kind,
    ).toBe("landing");
    expect(
      surfaceFor("eventdex-git-main-mauroviveros.vercel.app", root, deployment)
        .kind,
    ).toBe("landing");
    expect(surfaceFor("eventdex-demo.vercel.app", root, deployment)).toEqual({
      kind: "publica",
      host: "eventdex-demo.vercel.app",
    });
  });

  it("treats any other host as an organization domain", () => {
    expect(surfaceFor("expo.localhost:3000", root)).toEqual({
      kind: "publica",
      host: "expo.localhost:3000",
    });
    expect(surfaceFor("app.localhost:3000", root).kind).toBe("publica");
    expect(surfaceFor("ExpoUbbe.com", "eventdex.com")).toEqual({
      kind: "publica",
      host: "expoubbe.com",
    });
  });

  it("does not confuse a lookalike domain with the root", () => {
    expect(surfaceFor("eventdex.com.evil.io", "eventdex.com").kind).toBe(
      "publica",
    );
  });
});

describe("internalPath", () => {
  const root = { kind: "landing" } as const;

  it("serves the root host's folders as they are", () => {
    expect(internalPath(root, "/")).toBe("/");
    expect(internalPath(root, "/privacidad")).toBe("/privacidad");
    expect(internalPath(root, "/ingresar")).toBe("/ingresar");
    expect(internalPath(root, "/panel/expo/eventos")).toBe(
      "/panel/expo/eventos",
    );
  });

  it("keeps an organization's site out of the root host", () => {
    expect(internalPath(root, "/publica/expo.com/s/abc")).toBe("/_publica");
    expect(internalPath(root, "/publica")).toBe("/_publica");
    expect(internalPath(root, "/publicaciones")).toBe("/publicaciones");
  });

  it("keeps the host as a single encoded segment", () => {
    expect(
      internalPath({ kind: "publica", host: "expo.localhost:3000" }, "/s/abc"),
    ).toBe("/publica/expo.localhost%3A3000/s/abc");
  });
});

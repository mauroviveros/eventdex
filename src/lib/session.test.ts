import { describe, expect, it } from "vitest";
import { requestOrigin, safeNext } from "./session";

describe("safeNext", () => {
  it("keeps a path on this host", () => {
    expect(safeNext("/s/abc?x=1")).toBe("/s/abc?x=1");
  });

  it.each([
    null,
    "",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "evil",
  ])("falls back for %s", (next) => {
    expect(safeNext(next)).toBe("/");
  });
});

describe("requestOrigin", () => {
  it("uses the host the browser asked for", () => {
    expect(requestOrigin(new Headers({ host: "app.localhost:3000" }))).toBe(
      "http://app.localhost:3000",
    );
  });

  it("prefers the forwarded host and protocol behind a proxy", () => {
    const headers = new Headers({
      host: "internal:3000",
      "x-forwarded-host": "app.eventdex.com",
      "x-forwarded-proto": "https",
    });
    expect(requestOrigin(headers)).toBe("https://app.eventdex.com");
  });
});

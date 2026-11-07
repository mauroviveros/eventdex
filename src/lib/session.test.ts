import { describe, expect, it } from "vitest";
import { safeNext } from "./session";

describe("safeNext", () => {
  it("keeps a path on this host", () => {
    expect(safeNext("/s/abc?x=1")).toBe("/s/abc?x=1");
  });

  it.each([null, "", "https://evil.com", "//evil.com", "/\\evil.com", "evil"])(
    "falls back for %s",
    (next) => {
      expect(safeNext(next)).toBe("/");
    },
  );
});

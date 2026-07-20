import { describe, expect, it } from "vitest";
import { resolveSafeNextPath } from "./routes";

describe("resolveSafeNextPath", () => {
  it("cae a la raíz cuando no hay valor", () => {
    expect(resolveSafeNextPath(null)).toBe("/");
    expect(resolveSafeNextPath("")).toBe("/");
  });

  it("conserva rutas internas válidas", () => {
    expect(resolveSafeNextPath("/perfil")).toBe("/perfil");
    expect(resolveSafeNextPath("/spot/123?ref=qr")).toBe("/spot/123?ref=qr");
  });

  it("rechaza URLs absolutas (open redirect)", () => {
    expect(resolveSafeNextPath("https://evil.com")).toBe("/");
    expect(resolveSafeNextPath("http://evil.com")).toBe("/");
  });

  it("rechaza rutas protocol-relative (//host)", () => {
    expect(resolveSafeNextPath("//evil.com")).toBe("/");
  });
});

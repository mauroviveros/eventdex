import { describe, expect, it } from "vitest";
import { pixelAvatar } from "./avatar";

describe("pixelAvatar", () => {
  it("asks Google for the 36 px photo", () => {
    expect(pixelAvatar("https://lh3.googleusercontent.com/a/abc=s96-c")).toBe(
      "https://lh3.googleusercontent.com/a/abc=s36-c",
    );
  });

  it("leaves a URL without a size alone", () => {
    const url = "https://example.com/foto.png";
    expect(pixelAvatar(url)).toBe(url);
  });
});

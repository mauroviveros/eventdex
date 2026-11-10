import { describe, expect, it } from "vitest";
import { largeAvatar } from "./avatar";

describe("largeAvatar", () => {
  it("asks Google for the 288 px photo", () => {
    expect(largeAvatar("https://lh3.googleusercontent.com/a/abc=s96-c")).toBe(
      "https://lh3.googleusercontent.com/a/abc=s288-c",
    );
  });

  it("leaves a URL without a size alone", () => {
    const url = "https://example.com/foto.png";
    expect(largeAvatar(url)).toBe(url);
  });
});

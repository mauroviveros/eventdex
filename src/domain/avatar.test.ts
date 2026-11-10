import { describe, expect, it } from "vitest";
import { isGooglePhoto, largeAvatar } from "./avatar";

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

describe("isGooglePhoto", () => {
  it("accepts Google's photo hosts", () => {
    expect(isGooglePhoto("https://lh3.googleusercontent.com/a/abc=s96-c")).toBe(
      true,
    );
  });

  it.each([
    "http://lh3.googleusercontent.com/a/abc",
    "https://lh3.googleusercontent.com.evil.test/a",
    "https://evil.test/lh3.googleusercontent.com",
    "http://169.254.169.254/latest/meta-data",
    "http://localhost:54421/",
    "not a url",
  ])("rejects %s", (url) => {
    expect(isGooglePhoto(url)).toBe(false);
  });
});

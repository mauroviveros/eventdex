import { describe, expect, it } from "vitest";
import { toHex } from "./palette";
import { cardCount, cardName } from "./visitorCard";

describe("cardName", () => {
  it("shows the visitor's name", () => {
    expect(cardName({ name: "Ana García", email: "ana@example.com" })).toBe(
      "Ana García",
    );
  });

  it("never prints the mail", () => {
    expect(
      cardName({ name: "ana@example.com", email: "ana@example.com" }),
    ).toBe("Visitante");
  });
});

describe("cardCount", () => {
  it.each([
    [1, 48, "1 medalla"],
    [3, 48, "3 medallas"],
    [8, 8, "¡Las 8 medallas!"],
    [1, 1, "1 medalla"],
  ])("%i of %i says %s", (count, total, text) => {
    expect(cardCount(count, total)).toBe(text);
  });
});

describe("toHex", () => {
  it("converts oklch for generated images", () => {
    expect(toHex("oklch(1 0 0)")).toBe("#ffffff");
    expect(toHex("oklch(0 0 0)")).toBe("#000000");
  });
});

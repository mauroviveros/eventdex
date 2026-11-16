import { describe, expect, it } from "vitest";
import { toHex } from "./palette";
import { cardAward, cardCount, cardName } from "./visitorCard";

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

describe("cardAward", () => {
  it("names the place in an award with a cap, ahead of the others", () => {
    expect(
      cardAward([
        { title: "Mitad", position: 9, slots: null },
        { title: "Completa", position: 2, slots: 5 },
      ]),
    ).toBe("Lugar 2 de los primeros 5");
  });

  it("cuts a long name to fit the card's line", () => {
    const line = cardAward([
      {
        title: "Una remera firmada por todo el equipo del evento",
        position: 1,
        slots: null,
      },
    ]);
    expect(line).toBe("Ganó Una remera firmada por todo…");
  });

  it("falls back to the name, and is null with nothing won", () => {
    expect(cardAward([{ title: "Mitad", position: 9, slots: null }])).toBe(
      "Ganó Mitad",
    );
    expect(cardAward([])).toBeNull();
  });
});

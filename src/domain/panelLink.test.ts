import { describe, expect, it } from "vitest";
import { raffleLink } from "./panelLink";

describe("raffleLink", () => {
  it("points to the root domain's panel, over https in production", () => {
    expect(raffleLink("eventdex.com", "lo-de-charly", "expo-2026")).toBe(
      "https://eventdex.com/panel/lo-de-charly/eventos/expo-2026?tab=sorteo",
    );
  });

  it("uses http for a local root domain, with its port", () => {
    expect(raffleLink("localhost:3000", "expo", "expo-primavera")).toBe(
      "http://localhost:3000/panel/expo/eventos/expo-primavera?tab=sorteo",
    );
  });

  it("escapes a slug that is not a plain word", () => {
    expect(raffleLink("eventdex.com", "a b", "c/d")).toBe(
      "https://eventdex.com/panel/a%20b/eventos/c%2Fd?tab=sorteo",
    );
  });
});

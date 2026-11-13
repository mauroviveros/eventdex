import { describe, expect, it } from "vitest";
import { publicName } from "./raffles";

// The same cases as app.public_name in the raffles migration.
describe("publicName", () => {
  it.each([
    ["Ana García", "Ana G."],
    ["Ana María García", "Ana G."],
    ["  Ana   García  ", "Ana G."],
    ["ana garcía", "ana G."],
    ["Ana", "Ana"],
    ["", "Visitante"],
    ["   ", "Visitante"],
  ])("turns %j into %j", (name, expected) => {
    expect(publicName(name)).toBe(expected);
  });

  it("falls back to Visitante without a name", () => {
    expect(publicName(null)).toBe("Visitante");
    expect(publicName(undefined)).toBe("Visitante");
  });
});

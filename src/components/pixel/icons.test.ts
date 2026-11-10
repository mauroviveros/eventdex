import { describe, expect, it } from "vitest";
import { ICONS } from "./icons";

describe("ICONS", () => {
  it.each(Object.entries(ICONS))("%s is an 8×8 grid", (_, rows) => {
    expect(rows).toHaveLength(8);
    for (const row of rows) expect(row).toMatch(/^[#.]{8}$/);
  });
});

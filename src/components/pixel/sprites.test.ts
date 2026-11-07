import { describe, expect, it } from "vitest";
import { SPRITES } from "./sprites";

describe("sprites", () => {
  it.each(Object.entries(SPRITES))(
    "%s is a 12×12 grid of known pixels",
    (_, rows) => {
      expect(rows).toHaveLength(12);
      for (const row of rows) expect(row).toMatch(/^[.0-3]{12}$/);
    },
  );
});

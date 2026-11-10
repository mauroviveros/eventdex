import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps a pixel font size next to a text color", () => {
    expect(cn("text-px-1", "text-lcd-3")).toBe("text-px-1 text-lcd-3");
  });

  it("lets a later size win over an earlier one", () => {
    expect(cn("text-sm", "text-px-2")).toBe("text-px-2");
  });

  it("lets a later color win over an earlier one", () => {
    expect(cn("text-lcd-3", "text-lcd-0")).toBe("text-lcd-0");
  });
});

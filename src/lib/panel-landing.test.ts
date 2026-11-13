import { describe, expect, it } from "vitest";
import { panelLanding } from "./panel-landing";

describe("panelLanding", () => {
  it("sends the developer to the platform, even with an organization", () => {
    expect(
      panelLanding({ isDeveloper: true, organizations: [{ slug: "expo" }] }),
    ).toBe("/panel/plataforma/organizaciones");
  });

  it("sends a member to their organization", () => {
    expect(
      panelLanding({ isDeveloper: false, organizations: [{ slug: "expo" }] }),
    ).toBe("/panel/expo");
  });

  it("picks the first organization when there are several", () => {
    expect(
      panelLanding({
        isDeveloper: false,
        organizations: [{ slug: "expo" }, { slug: "feria" }],
      }),
    ).toBe("/panel/expo");
  });

  it("has no access without organization", () => {
    expect(panelLanding({ isDeveloper: false, organizations: [] })).toBe(
      "/panel/sin-acceso",
    );
  });
});

import { describe, expect, it } from "vitest";
import { adminLanding } from "./admin-landing";

describe("adminLanding", () => {
  it("sends the developer to the platform, even with an organization", () => {
    expect(
      adminLanding({ isDeveloper: true, organizations: [{ slug: "expo" }] }),
    ).toBe("/plataforma/organizaciones");
  });

  it("sends a member to their organization", () => {
    expect(
      adminLanding({ isDeveloper: false, organizations: [{ slug: "expo" }] }),
    ).toBe("/expo");
  });

  it("picks the first organization when there are several", () => {
    expect(
      adminLanding({
        isDeveloper: false,
        organizations: [{ slug: "expo" }, { slug: "feria" }],
      }),
    ).toBe("/expo");
  });

  it("has no access without organization", () => {
    expect(adminLanding({ isDeveloper: false, organizations: [] })).toBe(
      "/sin-acceso",
    );
  });
});

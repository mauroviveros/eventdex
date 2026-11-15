import { describe, expect, it } from "vitest";
import {
  PORTADA_SECTIONS,
  type PortadaSection,
  portadaGroups,
  previewNow,
} from "./portada";

const labels = (
  phase: Parameters<typeof portadaGroups>[0],
  have: readonly PortadaSection[] = PORTADA_SECTIONS,
) => portadaGroups(phase, have).map((g) => g.label);

describe("portadaGroups", () => {
  it.each(["proximo", "en-curso", "finalizado"] as const)(
    "lists each %s section once, in one group",
    (phase) => {
      const listed = portadaGroups(phase, PORTADA_SECTIONS).flatMap(
        (g) => g.sections,
      );
      expect(new Set(listed).size).toBe(listed.length);
      // Winners don't exist yet before; the days are done after.
      const left: PortadaSection[] = [];
      if (phase === "proximo") left.push("ganadores");
      if (phase === "finalizado") left.push("jornadas");
      expect([...listed].sort()).toEqual(
        PORTADA_SECTIONS.filter((s) => !left.includes(s)).sort(),
      );
    },
  );

  it("informs before, plays during and shows the aftermath after", () => {
    expect(labels("proximo")).toEqual(["El evento", "Juego", "Fotos"]);
    expect(labels("en-curso")).toEqual(["Juego", "El evento", "Fotos"]);
    expect(labels("finalizado")).toEqual(["Juego", "Fotos", "El evento"]);
  });

  it("leaves out a section the staff left empty, and a group left without any", () => {
    expect(labels("en-curso", ["medallas", "premios"])).toEqual(["Juego"]);
    const [game] = portadaGroups("en-curso", ["premios", "medallas"]);
    expect(game?.sections).toEqual(["medallas", "premios"]);
    expect(portadaGroups("proximo", [])).toEqual([]);
  });

  it("gives every group an id that is no section's own", () => {
    const ids = portadaGroups("en-curso", PORTADA_SECTIONS).map((g) => g.id);
    for (const id of ids) expect(PORTADA_SECTIONS).not.toContain(id);
  });
});

describe("previewNow", () => {
  const schedules = [
    { starts_at: "2026-11-14T15:00:00Z", ends_at: "2026-11-14T23:00:00Z" },
    { starts_at: "2026-11-15T15:00:00Z", ends_at: "2026-11-15T23:00:00Z" },
  ];
  const at = (phase: Parameters<typeof previewNow>[1]) =>
    previewNow(schedules, phase) as Date;

  it("is three days before the first schedule when upcoming", () => {
    expect(at("proximo").toISOString()).toBe("2026-11-11T15:00:00.000Z");
  });

  it("is halfway through the first schedule when in course", () => {
    expect(at("en-curso").toISOString()).toBe("2026-11-14T19:00:00.000Z");
  });

  it("is a day after the last schedule when finished", () => {
    expect(at("finalizado").toISOString()).toBe("2026-11-16T23:00:00.000Z");
  });

  it("does not depend on the order of the schedules", () => {
    expect(previewNow([...schedules].reverse(), "proximo")).toEqual(
      at("proximo"),
    );
  });

  it("has no moment without schedules", () => {
    expect(previewNow([], "en-curso")).toBeNull();
  });
});

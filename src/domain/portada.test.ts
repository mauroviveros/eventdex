import { describe, expect, it } from "vitest";
import {
  PORTADA_SECTIONS,
  type PortadaSection,
  portadaGroups,
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

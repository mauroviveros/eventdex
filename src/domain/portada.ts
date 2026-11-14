/**
 * The event's public page as a list of sections whose order follows the
 * event's phase: before it informs, while it runs it plays, after it shows
 * who won and what was lived.
 */

export const PORTADA_SECTIONS = [
  "ganadores",
  "acerca",
  "jornadas",
  "premios",
  "medallas",
  "como-llegar",
  "preguntas",
  "fotos",
  "ediciones",
] as const;
export type PortadaSection = (typeof PORTADA_SECTIONS)[number];

export type PortadaPhase = "proximo" | "en-curso" | "finalizado";

const ORDER: Record<PortadaPhase, readonly PortadaSection[]> = {
  proximo: [
    "acerca",
    "jornadas",
    "premios",
    "medallas",
    "como-llegar",
    "preguntas",
    "fotos",
    "ediciones",
  ],
  "en-curso": [
    "ganadores",
    "medallas",
    "premios",
    "jornadas",
    "acerca",
    "como-llegar",
    "preguntas",
    "fotos",
    "ediciones",
  ],
  finalizado: [
    "ganadores",
    "fotos",
    "ediciones",
    "acerca",
    "medallas",
    "premios",
    "preguntas",
    "como-llegar",
  ],
};

/**
 * The index groups the sections in three: the game, the event and the photos.
 * Ids are prefixed so they never collide with a section's own heading id.
 */
const GROUPS = [
  {
    id: "grupo-juego",
    label: "Juego",
    sections: ["ganadores", "jornadas", "premios", "medallas"],
  },
  {
    id: "grupo-evento",
    label: "El evento",
    sections: ["acerca", "como-llegar", "preguntas"],
  },
  { id: "grupo-fotos", label: "Fotos", sections: ["fotos", "ediciones"] },
] as const;

/**
 * The groups that have something to show, in the order this phase reads them:
 * a group sits where its first available section sits. A section the page
 * doesn't carry (the staff left it empty) is not listed, and neither is a
 * group left without sections.
 */
export function portadaGroups(
  phase: PortadaPhase,
  available: readonly PortadaSection[],
) {
  const order = ORDER[phase];
  return GROUPS.flatMap((g) => {
    const sections = order.filter(
      (s) =>
        (g.sections as readonly PortadaSection[]).includes(s) &&
        available.includes(s),
    );
    const first = sections[0];
    return first
      ? [{ id: g.id, label: g.label, sections, at: order.indexOf(first) }]
      : [];
  }).sort((a, b) => a.at - b.at);
}

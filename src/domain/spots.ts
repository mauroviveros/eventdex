/**
 * What a spot shows in an event. Three levels, first one set wins:
 * the edition's override, the snapshot frozen when the event was published,
 * and the live catalog. The snapshot keeps published editions from changing
 * when the catalog is edited later.
 */

export const SPOT_TYPES = [
  "stand",
  "attraction",
  "sponsor",
  "activity",
] as const;
export type SpotType = (typeof SPOT_TYPES)[number];

export type CatalogSpot = {
  name: string;
  description: string | null;
  logo_path: string | null;
  type: SpotType;
};

export type EventSpotFields = {
  name_override: string | null;
  description_override: string | null;
  /** jsonb from the database: trusted shape, read defensively. */
  snapshot: unknown;
};

export type ResolvedSpot = {
  name: string;
  description: string | null;
  logoPath: string | null;
  type: SpotType;
};

function frozen(snapshot: unknown): Partial<CatalogSpot> {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot))
    return {};
  const s = snapshot as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === "string" ? v : undefined);
  const type = SPOT_TYPES.find((t) => t === s.type);
  return {
    name: text(s.name),
    // null in the snapshot is a real "no description" and must win over the catalog.
    description: s.description === null ? null : text(s.description),
    logo_path: s.logo_path === null ? null : text(s.logo_path),
    type,
  };
}

export function resolveSpot(
  eventSpot: EventSpotFields,
  catalog: CatalogSpot,
): ResolvedSpot {
  const snap = frozen(eventSpot.snapshot);
  return {
    name: eventSpot.name_override ?? snap.name ?? catalog.name,
    description:
      eventSpot.description_override ??
      (snap.description !== undefined ? snap.description : catalog.description),
    logoPath: snap.logo_path !== undefined ? snap.logo_path : catalog.logo_path,
    type: snap.type ?? catalog.type,
  };
}

export const SPOT_TYPE_LABEL: Record<SpotType, string> = {
  stand: "Stand",
  attraction: "Atracción",
  sponsor: "Sponsor",
  activity: "Actividad",
};

/**
 * What a spot's QR encodes: /s/[id] on the org's primary domain. Printed, so it
 * never changes. Local hosts (*.localhost) are served over http.
 */
export function spotUrl(hostname: string, eventSpotId: string) {
  const local = /(^|\.)localhost(:\d+)?$/.test(hostname);
  return `${local ? "http" : "https"}://${hostname}/s/${eventSpotId}`;
}

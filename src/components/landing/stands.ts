import type { SpotType } from "@/domain/spots";

// Synthetic stands, only to try the mechanic.
export const STANDS: { code: string; name: string; type: SpotType }[] = [
  { code: "A01", name: "Café de la Esquina", type: "stand" },
  { code: "A02", name: "Rueda gigante", type: "attraction" },
  { code: "A03", name: "Banco del Parque", type: "sponsor" },
  { code: "A04", name: "Taller de cerámica", type: "activity" },
  { code: "A05", name: "Dulces del Sur", type: "stand" },
];

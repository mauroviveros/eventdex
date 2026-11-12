import type { SortDir } from "@/domain/table";

// What the event's URL can say: the tab (?tab=) and, per table, the sortable
// columns with the direction of their first click (?orden=). Shared by the
// server, which reads them, and the client components, which draw the links.

export const EVENT_TABS = ["general", "spots", "visitantes", "sorteo"] as const;
export type EventTab = (typeof EVENT_TABS)[number];

export const SPOT_SORTS = {
  codigo: "asc",
  nombre: "asc",
  puesto: "asc",
  puntos: "desc",
} as const satisfies Record<string, SortDir>;

export const VISITOR_SORTS = {
  nombre: "asc",
  medallas: "desc",
  desde: "desc",
} as const satisfies Record<string, SortDir>;

import type { SortDir } from "@/domain/table";

// The catalog's sortable columns, with the direction of their first click.
// Shared by the page, which sorts, and the table, which draws the links.
export const CATALOG_SORTS = {
  nombre: "asc",
  tipo: "asc",
  eventos: "desc",
  estado: "asc",
} as const satisfies Record<string, SortDir>;

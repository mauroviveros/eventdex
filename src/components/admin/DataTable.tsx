"use client";

import {
  type ColumnDef,
  type RowData,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Chevron } from "@/components/pixel/Chevron";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import type { SortDir } from "@/domain/table";
import { cn } from "@/lib/utils";

/** Core only: sorting and pages are the server's, through the URL. */
export const features = tableFeatures({});

type Props<T extends RowData> = {
  /** The table's accessible name ("Visitantes"). */
  label: string;
  // biome-ignore lint/suspicious/noExplicitAny: each column has its own value type
  columns: ColumnDef<typeof features, T, any>[];
  rows: T[];
  rowId: (row: T) => string;
  /** Sortable column ids, each with the direction of its first click. */
  sortable: Partial<Record<string, SortDir>>;
  sort: { orden: string; dir: SortDir };
  page: number;
  pageCount: number;
  /** Extra classes per row (a blocked visitor, an inactive spot). */
  rowClassName?: (row: T) => string | undefined;
};

/**
 * The panel's table. TanStack Table lays out columns and cells; the order and
 * the page live in the URL (?orden=…&dir=…&pag=…), so the server sorts and
 * cuts, and a link shows the same page. Under 640 px each row is a card with
 * its column names, and the sortable headers stay as a strip of links.
 */
export function DataTable<T extends RowData>({
  label,
  columns,
  rows,
  rowId,
  sortable,
  sort,
  page,
  pageCount,
  rowClassName,
}: Props<T>) {
  const table = useTable({
    features: features,
    columns,
    data: rows,
    getRowId: rowId,
  });
  const pathname = usePathname();
  const params = useSearchParams();
  const href = (change: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(change)) next.set(k, v);
    if (next.get("pag") === "1") next.delete("pag");
    return `${pathname}?${next}`;
  };

  return (
    <div className="grid gap-4">
      <Table aria-label={label} className="max-sm:block">
        <TableHeader className="max-sm:block">
          {table.getHeaderGroups().map((group) => (
            <TableRow
              key={group.id}
              className="max-sm:flex max-sm:flex-wrap max-sm:gap-x-4 max-sm:pb-1"
            >
              {group.headers.map((header) => {
                const id = header.column.id;
                const first = sortable[id];
                const active = sort.orden === id;
                const content = <table.FlexRender header={header} />;
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      active
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={cn("max-sm:py-0", !first && "max-sm:hidden")}
                  >
                    {first ? (
                      <Link
                        href={href({
                          orden: id,
                          dir: active
                            ? sort.dir === "asc"
                              ? "desc"
                              : "asc"
                            : first,
                          pag: "1",
                        })}
                        scroll={false}
                        className="inline-flex min-h-11 items-center gap-2 no-underline hover:underline"
                      >
                        {content}
                        <Chevron
                          className={cn(
                            !active && "opacity-0",
                            active && sort.dir === "asc" && "rotate-180",
                          )}
                        />
                      </Link>
                    ) : (
                      // Same height as the sortable links, so all names share a line.
                      <span className="inline-flex min-h-11 items-center">
                        {content}
                      </span>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="max-sm:grid max-sm:gap-2 max-sm:pt-2">
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(
                "align-middle max-sm:grid max-sm:gap-2 max-sm:border-2 max-sm:border-solid max-sm:border-lcd-3 max-sm:p-4",
                rowClassName?.(row.original),
              )}
            >
              {row.getAllCells().map((cell) => {
                const header = cell.column.columnDef.header;
                return (
                  <TableCell
                    key={cell.id}
                    data-label={typeof header === "string" ? header : undefined}
                    className="max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-x-3 max-sm:p-0 max-sm:data-label:before:font-display max-sm:data-label:before:text-px-1 max-sm:data-label:before:text-muted-foreground max-sm:data-label:before:content-[attr(data-label)]"
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pageCount > 1 && (
        <nav
          aria-label={`Páginas de ${label.toLowerCase()}`}
          className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2"
        >
          <p className="font-display text-px-1 tabular-nums">
            Página {page} de {pageCount}
          </p>
          <div className="flex">
            <PageLink to={href({ pag: "1" })} off={page === 1} name="Primera">
              <Chevron className="rotate-90" />
              <Chevron className="-ml-2 rotate-90" />
            </PageLink>
            <PageLink
              to={href({ pag: String(page - 1) })}
              off={page === 1}
              name="Anterior"
            >
              <Chevron className="rotate-90" />
            </PageLink>
            <PageLink
              to={href({ pag: String(page + 1) })}
              off={page === pageCount}
              name="Siguiente"
            >
              <Chevron className="-rotate-90" />
            </PageLink>
            <PageLink
              to={href({ pag: String(pageCount) })}
              off={page === pageCount}
              name="Última"
            >
              <Chevron className="-rotate-90" />
              <Chevron className="-ml-2 -rotate-90" />
            </PageLink>
          </div>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  to,
  off,
  name,
  children,
}: {
  to: string;
  off: boolean;
  name: string;
  children: ReactNode;
}) {
  const box =
    "-ml-0.5 flex size-11 items-center justify-center border-2 border-lcd-3 first:ml-0";
  return off ? (
    <button
      type="button"
      disabled
      aria-label={`${name} página`}
      className={cn(box, "text-muted-foreground opacity-50")}
    >
      {children}
    </button>
  ) : (
    <Link
      href={to}
      scroll={false}
      aria-label={`${name} página`}
      className={cn(box, "hover:bg-lcd-1")}
    >
      {children}
    </Link>
  );
}

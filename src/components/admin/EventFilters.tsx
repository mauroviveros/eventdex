import Link from "next/link";
import { SearchIcon } from "@/components/pixel/SearchIcon";
import { Input } from "@/components/ui/shadcn/input";

export type PhaseFilter =
  | "todos"
  | "en-curso"
  | "proximo"
  | "finalizado"
  | "borrador";

const LABEL: Record<PhaseFilter, string> = {
  todos: "Todos",
  "en-curso": "En curso",
  proximo: "Próximos",
  finalizado: "Finalizados",
  borrador: "Borradores",
};

type Props = {
  /** Path the filters point to (the events list). */
  basePath: string;
  current: PhaseFilter;
  counts: Record<PhaseFilter, number>;
  query?: string;
};

/**
 * Search plus phase filters for an events list. Both live in the URL
 * (?q=…&fase=…), so a filtered list can be shared and survives a reload.
 */
export function EventFilters({ basePath, current, counts, query = "" }: Props) {
  const href = (fase: PhaseFilter) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (fase !== "todos") params.set("fase", fase);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex flex-wrap items-stretch gap-3">
      <search className="flex min-w-64 flex-1">
        <form action={basePath} method="get" className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
            <SearchIcon />
          </span>
          <label htmlFor="buscar-eventos" className="sr-only">
            Buscar eventos
          </label>
          <Input
            id="buscar-eventos"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Buscar por nombre o sede"
            className="pl-10"
          />
          {current !== "todos" && (
            <input type="hidden" name="fase" value={current} />
          )}
        </form>
      </search>

      <nav
        aria-label="Filtrar por fase"
        className="flex overflow-x-auto border-2 border-lcd-3"
      >
        {(Object.keys(LABEL) as PhaseFilter[]).map((fase) => (
          <Link
            key={fase}
            href={href(fase)}
            aria-current={fase === current ? "page" : undefined}
            className="flex min-h-11 shrink-0 items-center gap-2 border-r-2 border-lcd-3 px-3 font-display text-px-1 whitespace-nowrap no-underline last:border-r-0 hover:bg-lcd-1 aria-[current=page]:bg-lcd-3 aria-[current=page]:text-lcd-0"
          >
            {LABEL[fase]}
            <span className="tabular-nums opacity-80">{counts[fase]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

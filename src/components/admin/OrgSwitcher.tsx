import Link from "next/link";
import { Chevron } from "@/components/pixel/Chevron";
import { Monogram } from "./Monogram";

type Org = { slug: string; name: string; role?: "owner" | "staff" };

const ROLE = { owner: "Owner", staff: "Staff" } as const;

/**
 * The organization you are in, at the top of the rail. With more than one,
 * it opens a list to switch (native <details>: no JS, keyboard included).
 */
export function OrgSwitcher({ current, all }: { current: Org; all: Org[] }) {
  const others = all.filter((o) => o.slug !== current.slug);
  const head = (
    <>
      <Monogram text={current.name} />
      <span className="grid min-w-0 flex-1">
        <span className="truncate font-display text-px-1">{current.name}</span>
        {current.role && (
          <span className="text-sm text-muted-foreground">
            {ROLE[current.role]}
          </span>
        )}
      </span>
    </>
  );

  if (others.length === 0) {
    return <div className="flex items-center gap-3 p-3">{head}</div>;
  }

  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 p-3 hover:bg-lcd-1 [&::-webkit-details-marker]:hidden">
        {head}
        <Chevron className="group-open:rotate-180" />
        <span className="sr-only">Cambiar de organización</span>
      </summary>
      <ul className="absolute inset-x-2 top-full z-20 grid border-2 border-lcd-3 bg-lcd-0">
        {others.map((org) => (
          <li key={org.slug}>
            <Link
              href={`/${org.slug}`}
              className="flex min-h-11 items-center gap-3 px-3 no-underline hover:bg-lcd-1"
            >
              <Monogram text={org.name} size="sm" />
              <span className="truncate">{org.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

import Link from "next/link";

type Props = {
  shown: { id: string; code: string; name: string }[];
  /** Stands missing beyond the ones named. */
  more: number;
  /** Where the whole collection is, for the ones not named. */
  href: string;
};

/** What the celebration says is still to find: a few stands by name, and a way to see the rest. */
export function MissingSpots({ shown, more, href }: Props) {
  if (shown.length === 0) return null;
  return (
    <section aria-label="Stands que te faltan" className="grid gap-2">
      <p className="font-display text-px-1">
        {shown.length + more === 1
          ? "Te falta este stand"
          : "Todavía te faltan"}
      </p>
      <ul className="grid gap-1 text-sm">
        {shown.map((s) => (
          <li key={s.id}>
            <span className="font-display text-px-1">{s.code}</span> {s.name}
          </li>
        ))}
      </ul>
      {more > 0 && (
        <Link
          href={href}
          className="inline-flex min-h-11 w-fit items-center text-sm"
        >
          y {more.toLocaleString("es-AR")} más: verlos todos
        </Link>
      )}
    </section>
  );
}

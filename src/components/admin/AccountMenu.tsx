import { Chevron } from "@/components/pixel/Chevron";
import { Monogram } from "@/components/ui/Monogram";

/** Who is signed in: foot of the rail on desktop, end of the brand row on phones. Opens toward the page. */
export function AccountMenu({
  email,
  compact = false,
}: {
  email: string | null;
  /** Phones: just the monogram, at the end of the brand row. */
  compact?: boolean;
}) {
  const label = email ?? "Tu cuenta";
  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 p-3 hover:bg-lcd-1 [&::-webkit-details-marker]:hidden">
        <Monogram text={label} size="sm" />
        <span
          className={compact ? "sr-only" : "min-w-0 flex-1 truncate text-sm"}
        >
          {label}
        </span>
        <Chevron
          className={
            compact ? "group-open:rotate-180" : "rotate-180 group-open:rotate-0"
          }
        />
        <span className="sr-only">Opciones de la cuenta</span>
      </summary>
      <div
        className={`absolute z-20 border-2 border-lcd-3 bg-lcd-0 ${
          compact ? "top-full right-2 w-64" : "inset-x-2 bottom-full"
        }`}
      >
        {compact && (
          <p className="truncate border-b-2 border-lcd-3 px-3 py-2 text-sm">
            {label}
          </p>
        )}
        <form action="/auth/salir" method="post">
          <button
            type="submit"
            className="flex min-h-11 w-full items-center px-3 font-display text-px-1 hover:bg-lcd-1"
          >
            Salir
          </button>
        </form>
      </div>
    </details>
  );
}

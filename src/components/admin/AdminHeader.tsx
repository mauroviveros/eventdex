import Link from "next/link";
import { NavLink } from "./NavLink";

type Props = { email: string | null; isDeveloper: boolean };

/** Top bar of the admin and the platform: brand, sections, account. */
export function AdminHeader({ email, isDeveloper }: Props) {
  return (
    <header className="border-b-2 border-lcd-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <nav aria-label="Principal" className="flex items-center gap-6">
          <Link href="/" className="font-display text-px-2 no-underline">
            Eventdex
          </Link>
          <NavLink href="/">Organizaciones</NavLink>
          {isDeveloper && (
            <NavLink href="/plataforma/organizaciones">Plataforma</NavLink>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {email && (
            <span className="max-w-56 truncate text-sm text-muted-foreground">
              {email}
            </span>
          )}
          <form action="/auth/salir" method="post">
            <button
              type="submit"
              className="min-h-11 font-display text-px-1 underline decoration-2 underline-offset-4 hover:text-muted-foreground"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

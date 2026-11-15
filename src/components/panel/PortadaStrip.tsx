"use client";

import Link from "next/link";
import { Chevron } from "@/components/pixel/Chevron";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import type { PortadaPhase } from "@/domain/portada";

const PHASES: { value: PortadaPhase; label: string }[] = [
  { value: "proximo", label: "Próximo" },
  { value: "en-curso", label: "En curso" },
  { value: "finalizado", label: "Finalizado" },
];

const ITEM =
  "inline-flex min-h-11 items-center gap-2 px-3 no-underline hover:bg-lcd-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lcd-0 data-[state=open]:bg-lcd-2";

/**
 * The team's bar over the preview, like the admin bar of a CMS: inverted, one
 * line, always on top. Back to the event on the left; the phase it is read in
 * (starting at the real one) and what is still missing as menus; the page's
 * editor on the right. In the panel's colors, so it never passes for the
 * public page.
 */
export function PortadaStrip({
  base,
  draft,
  real,
  shown,
  missing,
  sticky = true,
}: {
  base: string;
  draft: boolean;
  /** The phase the event is really in; null with no schedules. */
  real: PortadaPhase | null;
  shown: PortadaPhase | null;
  missing: { label: string; href: string }[];
  /** Fixed on top while the page scrolls; off to show it inside a sample. */
  sticky?: boolean;
}) {
  const shownLabel = PHASES.find((p) => p.value === shown)?.label;

  return (
    <nav
      aria-label="Vista del equipo"
      className={`${sticky ? "sticky top-0 z-40" : ""} flex min-h-11 items-center bg-lcd-3 text-lcd-0`}
    >
      <Link href={base} aria-label="Volver al evento" className={ITEM}>
        <Chevron className="rotate-90" />
        <span className="max-sm:sr-only">Volver al evento</span>
      </Link>
      <span className="px-3 font-display text-px-1 max-md:sr-only">
        Vista del equipo
      </span>

      {shown && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className={ITEM}>
            <span className="max-sm:sr-only">Fase: </span>
            {shownLabel}
            <Chevron />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-44">
            {PHASES.map((p) => (
              <DropdownMenuItem key={p.value} asChild>
                <Link
                  href={`${base}/portada?fase=${p.value}`}
                  replace
                  scroll={false}
                  aria-current={p.value === shown ? "true" : undefined}
                  className="no-underline"
                >
                  {p.value === shown ? "✓ " : ""}
                  {p.label}
                  {p.value === real && " (real)"}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {draft && <span className="px-3 text-sm">Borrador</span>}

      {missing.length > 0 && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className={ITEM}>
            Faltan {missing.length}
            <Chevron />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-44">
            {missing.map((m) => (
              <DropdownMenuItem key={m.label} asChild>
                <Link href={m.href} className="no-underline">
                  Cargar {m.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Link href={`${base}?tab=pagina`} className={`${ITEM} ml-auto`}>
        Editar página
      </Link>
    </nav>
  );
}

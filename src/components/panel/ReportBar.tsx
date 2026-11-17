"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * The team's bar over a report: back to the event and Imprimir. Out of the paper.
 */
export function ReportBar({ back }: { back: string }) {
  return (
    <nav
      aria-label="Informe"
      className="sticky top-0 z-10 flex min-h-11 items-center justify-between gap-3 border-b-2 border-lcd-3 bg-lcd-0 px-4 py-2 print:hidden"
    >
      <Link href={back} className="font-display text-px-1">
        Volver al evento
      </Link>
      <Button onClick={() => window.print()}>Imprimir</Button>
    </nav>
  );
}

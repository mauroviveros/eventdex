import Link from "next/link";
import type { ReactNode } from "react";

// shortcut: contact address not confirmed by the owner yet, confirm before going live
export const CONTACT_EMAIL = "hola@eventdex.com";
export const UPDATED = "7 de noviembre de 2026";

/** Shared frame for the legal pages: readable measure, plain structure. */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid max-w-prose gap-6 px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="justify-self-start font-display text-px-2 no-underline"
      >
        Eventdex
      </Link>
      <h1 className="text-px-3 sm:text-px-4">{title}</h1>
      <p className="text-sm text-muted-foreground">
        Última actualización: {UPDATED}
      </p>
      <div className="grid gap-4 [&_h2]:mt-4 [&_h2]:text-px-2 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </main>
  );
}

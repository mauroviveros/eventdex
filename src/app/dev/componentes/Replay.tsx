"use client";

import { type ReactNode, useState } from "react";

/** Remounts its children so a one-shot animation can be seen again. */
export function Replay({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [run, setRun] = useState(0);
  return (
    <div className={`grid justify-items-start gap-3 ${className}`}>
      <div key={run} className="w-full">
        {children}
      </div>
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="font-display text-px-1 underline decoration-2 underline-offset-4 hover:text-muted-foreground"
      >
        Repetir animación
      </button>
    </div>
  );
}

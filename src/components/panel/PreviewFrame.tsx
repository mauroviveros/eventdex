"use client";

import type { ReactNode } from "react";

/**
 * The public page inside the panel: its links point at the org's own site, so
 * a click on one does nothing. In-page anchors (#medallas) and the controls
 * (questions, photos) keep working.
 */
export function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div
      onClickCapture={(e) => {
        const a = (e.target as Element).closest("a");
        const href = a?.getAttribute("href");
        if (href && !href.startsWith("#")) e.preventDefault();
      }}
    >
      {children}
    </div>
  );
}

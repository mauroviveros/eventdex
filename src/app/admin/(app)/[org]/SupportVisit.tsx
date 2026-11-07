"use client";

import { useEffect, useRef } from "react";
import { logSupportVisitAction } from "@/lib/actions/organizations";

/**
 * Audits a support-mode visit from the browser, once per organization opened.
 * Prefetches render the layout on the server but never mount this, so only
 * real visits leave a support.viewed row.
 */
export function SupportVisit({ organizationId }: { organizationId: string }) {
  const logged = useRef<string | null>(null);
  useEffect(() => {
    // The ref also absorbs React's double effect run in development.
    if (logged.current === organizationId) return;
    logged.current = organizationId;
    logSupportVisitAction(organizationId);
  }, [organizationId]);
  return null;
}

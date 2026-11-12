"use client";

import { useLinkStatus } from "next/link";

/**
 * A Link's text that says it's on its way ("Abriendo…") while the route
 * loads, for pages with no loading.tsx of their own (the event looks itself up
 * before streaming, to answer a real 404). Goes inside the Link.
 */
export function LinkLabel({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useLinkStatus();
  return pending ? pendingLabel : label;
}

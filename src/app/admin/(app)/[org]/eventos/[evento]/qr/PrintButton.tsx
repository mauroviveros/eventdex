"use client";

import { Button } from "@/components/ui/Button";

/** Opens the browser's print dialog for the QR sheet. */
export function PrintButton() {
  return <Button onClick={() => window.print()}>Imprimir</Button>;
}

"use client";

import { useEffect } from "react";
import { AlertIcon } from "@/components/pixel/AlertIcon";
import { Button } from "@/components/ui/Button";

/** Inside the org's layout: the visitor keeps its brand and can retry. */
export default function PublicaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto grid w-full max-w-3xl justify-items-center px-4 py-10 sm:px-6">
      <div className="panel grid w-full max-w-sm gap-4 px-6 py-8">
        <h1 className="flex items-center gap-2 text-px-3 text-danger">
          <AlertIcon size={24} />
          Algo falló
        </h1>
        <p>
          Puede ser la señal del predio. Probá de nuevo; si escaneaste un QR, tu
          medalla no se pierde.
        </p>
        <Button onClick={reset} className="justify-self-start">
          Reintentar
        </Button>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Error boundary de segmento: captura errores de render/datos en las páginas y
// ofrece reintentar, en vez de romper con la pantalla de error por defecto.
export default function ErrorBoundary({
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
    <section className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <h2 className="font-press-start text-2xl text-secondary">
        Algo salió mal
      </h2>
      <p className="max-w-md text-lg text-muted-foreground">
        Ocurrió un error inesperado. Probá de nuevo en un momento.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </section>
  );
}

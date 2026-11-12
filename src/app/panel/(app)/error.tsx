"use client";

import { useEffect } from "react";
import { AlertIcon } from "@/components/pixel/AlertIcon";
import { Button } from "@/components/ui/Button";

export default function AdminError({
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
    <div className="panel grid max-w-lg gap-4 px-6 py-8">
      <h1 className="flex items-center gap-2 text-px-3 text-danger">
        <AlertIcon size={24} />
        No pudimos cargar esta página
      </h1>
      <p>
        Puede ser la conexión o un problema nuestro. Probá de nuevo en un
        momento.
      </p>
      <Button onClick={reset} className="justify-self-start">
        Reintentar
      </Button>
    </div>
  );
}

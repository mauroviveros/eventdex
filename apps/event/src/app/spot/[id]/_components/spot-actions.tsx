import { ArrowLeft, User as UserIcon } from "@nsmr/pixelart-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Fila de acciones al pie de la vista de spot: volver al inicio / ir al perfil. */
export function SpotActions() {
  return (
    <div className="flex w-full flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link href="/">
          <ArrowLeft className="size-5" />
          Volver al inicio
        </Link>
      </Button>
      <Button asChild className="w-full sm:w-auto">
        <Link href="/perfil">
          <UserIcon className="size-5" />
          Ir al perfil
        </Link>
      </Button>
    </div>
  );
}

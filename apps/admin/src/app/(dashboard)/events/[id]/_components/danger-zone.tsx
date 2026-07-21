"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteEvent, setEventStatus } from "../../actions";

export function DangerZone({
  eventId,
  status,
  title,
}: {
  eventId: string;
  status: "ACTIVE" | "INACTIVE" | null;
  title: string;
}) {
  const isActive = status === "ACTIVE";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado y baja</CardTitle>
        <CardDescription>
          {isActive
            ? "El evento está activo: los QR de sus spots aceptan escaneos."
            : "El evento está inactivo."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() =>
            setEventStatus(eventId, isActive ? "INACTIVE" : "ACTIVE")
          }
        >
          {isActive ? "Desactivar evento" : "Activar evento"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Eliminar evento</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar “{title}”?</AlertDialogTitle>
              <AlertDialogDescription>
                El evento deja de aparecer en el dashboard (baja lógica: el
                historial de escaneos se conserva).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteEvent(eventId)}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

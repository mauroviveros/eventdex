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
import { deleteSpot } from "../../actions";

export function SpotDangerZone({
  eventId,
  spotId,
  name,
  scanCount,
  showDeleteError,
}: {
  eventId: string;
  spotId: string;
  name: string;
  scanCount: number;
  showDeleteError: boolean;
}) {
  const hasScans = scanCount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Baja</CardTitle>
        <CardDescription>
          {hasScans
            ? `Este spot tiene ${scanCount} escaneo${scanCount === 1 ? "" : "s"}: no se puede eliminar porque el historial alimenta el sorteo.`
            : "Sin escaneos: se puede eliminar (también borra su avatar del storage)."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={hasScans}>
                Eliminar spot
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar “{name}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borra el spot y su imagen. Esta acción no se puede
                  deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteSpot(eventId, spotId)}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {showDeleteError && (
          <p className="text-destructive text-xs">
            No se pudo eliminar: el spot registró escaneos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

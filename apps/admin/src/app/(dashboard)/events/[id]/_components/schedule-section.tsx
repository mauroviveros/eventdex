import type { Tables } from "@eventdex/database";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateRange, utcIsoToLocal } from "@/utils";
import { addSchedule, deleteSchedule } from "../../actions";

/**
 * Horarios del evento: lista con borrado por fila + form de alta. Server
 * component; los forms invocan Server Actions directamente.
 */
export function ScheduleSection({
  event,
  schedules,
  showError,
}: {
  event: { id: string; timezone: string };
  schedules: Tables<"event_schedules">[];
  showError: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Horarios</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {schedules.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Sin horarios cargados.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {schedules.map((schedule) => (
              <li
                key={schedule.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <div>
                    {formatDateRange(
                      schedule.start_datetime,
                      schedule.end_datetime,
                      event.timezone,
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {utcIsoToLocal(
                      schedule.start_datetime,
                      event.timezone,
                    ).replace("T", " ")}
                    {" → "}
                    {utcIsoToLocal(
                      schedule.end_datetime,
                      event.timezone,
                    ).replace("T", " ")}
                  </div>
                </div>
                <form action={deleteSchedule.bind(null, event.id, schedule.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar horario"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form
          action={addSchedule.bind(null, event.id)}
          className="flex flex-col gap-3 rounded-md border p-3"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start_datetime">Inicio</Label>
              <Input
                id="start_datetime"
                name="start_datetime"
                type="datetime-local"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_datetime">Fin</Label>
              <Input
                id="end_datetime"
                name="end_datetime"
                type="datetime-local"
                required
              />
            </div>
          </div>
          {showError && (
            <p className="text-destructive text-xs">
              Horario inválido: el fin debe ser posterior al inicio.
            </p>
          )}
          <div>
            <Button type="submit" variant="outline" size="sm">
              Agregar horario
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

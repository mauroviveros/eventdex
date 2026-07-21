import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScansPerHourChart, ScansPerSpotChart } from "./analytics-charts";
import { DaySelect } from "./day-select";

/** Layout de los dos gráficos, con estados vacíos server-side. */
export function AnalyticsChartsSection({
  eventId,
  days,
  selectedDay,
  perHour,
  perSpot,
}: {
  eventId: string;
  days: { day: string; label: string }[];
  selectedDay: string | null;
  perHour: { hour: number; label: string; count: number }[];
  perSpot: { name: string; count: number }[];
}) {
  const selectedLabel = days.find((d) => d.day === selectedDay)?.label;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Escaneos por hora</CardTitle>
          <CardDescription>
            {selectedLabel
              ? `Horas del ${selectedLabel}, en el timezone del evento.`
              : "En el timezone del evento."}
          </CardDescription>
          {selectedDay && days.length > 1 && (
            <CardAction>
              <DaySelect
                eventId={eventId}
                days={days}
                selectedDay={selectedDay}
              />
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {perHour.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Sin escaneos ni horario programado para graficar.
            </p>
          ) : (
            <ScansPerHourChart data={perHour} />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Escaneos por spot</CardTitle>
          <CardDescription>Incluye spots sin escaneos.</CardDescription>
        </CardHeader>
        <CardContent>
          {perSpot.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Este evento no tiene spots.
            </p>
          ) : (
            <ScansPerSpotChart data={perSpot} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

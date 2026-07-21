import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScansOverTimeChart, ScansPerSpotChart } from "./analytics-charts";

/** Layout de los dos gráficos, con estados vacíos server-side. */
export function AnalyticsChartsSection({
  perDay,
  perSpot,
}: {
  perDay: { day: string; label: string; count: number }[];
  perSpot: { name: string; count: number }[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Escaneos en el tiempo</CardTitle>
          <CardDescription>Por día calendario del evento.</CardDescription>
        </CardHeader>
        <CardContent>
          {perDay.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin escaneos aún.</p>
          ) : (
            <ScansOverTimeChart data={perDay} />
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

import { MapPin, ScanLine, Users } from "lucide-react";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEventAnalytics } from "@/server/analytics";
import { getOrganizationEvents } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { PageHeader } from "../_components/page-header";
import { AnalyticsChartsSection } from "./_components/charts-section";
import { EventSelect } from "./_components/event-select";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership } = await requireMembership();
  const query = await searchParams;

  const events = await getOrganizationEvents(membership.organizationId);
  if (events.length === 0) {
    return (
      <>
        <PageHeader title="Analytics" />
        <main className="p-4">
          <p className="py-12 text-center text-muted-foreground text-sm">
            Sin eventos todavía: creá uno para ver sus métricas.
          </p>
        </main>
      </>
    );
  }

  const selected =
    events.find((event) => event.id === query.event) ??
    events.find((event) => event.status === "ACTIVE") ??
    events[0];

  const analytics = await getEventAnalytics(
    membership.organizationId,
    selected.id,
    selected.timezone,
    typeof query.day === "string" ? query.day : undefined,
  );

  const kpis = [
    { title: "Escaneos", icon: ScanLine, value: analytics.totals.scans },
    {
      title: "Participantes",
      icon: Users,
      value: analytics.totals.participants,
    },
    { title: "Spots", icon: MapPin, value: analytics.totals.spots },
  ];

  return (
    <>
      <PageHeader title="Analytics">
        <EventSelect events={events} selectedId={selected.id} />
      </PageHeader>
      <main className="flex flex-col gap-4 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <kpi.icon className="size-4" />
                  {kpi.title}
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {kpi.value}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <AnalyticsChartsSection
          eventId={selected.id}
          days={analytics.days}
          selectedDay={analytics.selectedDay}
          perHour={analytics.perHour}
          perSpot={analytics.perSpot}
        />

        <Card>
          <CardHeader>
            <CardTitle>Últimos escaneos</CardTitle>
            <CardDescription>
              Horarios en el timezone del evento ({selected.timezone}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Todavía no hay escaneos en este evento.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead>Spot</TableHead>
                    <TableHead className="text-right">Cuándo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.recent.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-medium">{scan.user}</TableCell>
                      <TableCell>{scan.spot}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {scan.when}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

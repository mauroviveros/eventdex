import { CalendarDays, MapPin, ScanLine, Users } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrganizationEvents } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { PageHeader } from "./_components/page-header";

export default async function DashboardPage() {
  const { membership } = await requireMembership();
  const events = await getOrganizationEvents(membership.organizationId);

  const stats = [
    {
      title: "Eventos",
      icon: CalendarDays,
      value: events.length,
      detail: `${events.filter((e) => e.status === "ACTIVE").length} activos`,
    },
    {
      title: "Spots",
      icon: MapPin,
      value: events.reduce((sum, e) => sum + e.spotCount, 0),
      detail: "en todos los eventos",
    },
    {
      title: "Escaneos",
      icon: ScanLine,
      value: events.reduce((sum, e) => sum + e.scanCount, 0),
      detail: "medallas coleccionadas",
    },
    {
      title: "Participantes",
      icon: Users,
      value: events.reduce((sum, e) => sum + e.participantCount, 0),
      detail: "únicos por evento",
    },
  ];

  return (
    <>
      <PageHeader title={membership.organization.name} />
      <main className="flex flex-col gap-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <stat.icon className="size-4" />
                  {stat.title}
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {stat.value}
                </CardTitle>
                <CardDescription>{stat.detail}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}

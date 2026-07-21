import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrganizationEvents } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { formatDateRange } from "@/utils";
import { PageHeader } from "../_components/page-header";

export const metadata: Metadata = { title: "Eventos" };

export default async function EventsPage() {
  const { membership } = await requireMembership();
  const events = await getOrganizationEvents(membership.organizationId);

  return (
    <>
      <PageHeader title="Eventos" />
      <main className="flex flex-col gap-4 p-4">
        {events.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground text-sm">
            Todavía no hay eventos en {membership.organization.name}. La
            creación de eventos llega en la próxima iteración del dashboard.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead className="text-right">Spots</TableHead>
                  <TableHead className="text-right">Escaneos</TableHead>
                  <TableHead className="text-right">Participantes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="font-medium">{event.title}</div>
                      {event.edition && (
                        <div className="text-muted-foreground text-xs">
                          {event.edition}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {event.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {event.range
                        ? formatDateRange(
                            event.range.start,
                            event.range.end,
                            event.timezone,
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>{event.city ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {event.spotCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {event.scanCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {event.participantCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </>
  );
}

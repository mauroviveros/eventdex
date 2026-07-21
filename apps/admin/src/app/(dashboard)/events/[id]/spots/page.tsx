import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrganizationEvent } from "@/server/events";
import { requireMembership } from "@/server/guard";
import { getEventSpots } from "@/server/spots";
import { PageHeader } from "../../../_components/page-header";

export const metadata: Metadata = { title: "Spots" };

const TYPE_LABEL = { LOCAL: "Local", ATTRACTION: "Atracción" } as const;

export default async function SpotsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { membership } = await requireMembership();
  const { id } = await params;

  const event = await getOrganizationEvent(membership.organizationId, id);
  if (!event) notFound();

  const spots = await getEventSpots(membership.organizationId, id);

  return (
    <>
      <PageHeader title={`Spots · ${event.title}`}>
        <Button asChild size="sm">
          <Link href={`/events/${event.id}/spots/new`}>
            <Plus className="size-4" />
            Nuevo spot
          </Link>
        </Button>
      </PageHeader>
      <main className="flex flex-col gap-4 p-4">
        {spots.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground text-sm">
            Este evento todavía no tiene spots. Creá el primero con “Nuevo
            spot”.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spot</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Escaneos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spots.map((spot) => (
                  <TableRow key={spot.id}>
                    <TableCell>
                      <Link
                        href={`/events/${event.id}/spots/${spot.id}`}
                        className="flex items-center gap-3"
                      >
                        <Image
                          src={spot.avatar_url}
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 rounded-lg border object-cover"
                        />
                        <span className="font-medium hover:underline">
                          {spot.name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {spot.type ? TYPE_LABEL[spot.type] : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{spot.location || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {spot.scanCount}
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

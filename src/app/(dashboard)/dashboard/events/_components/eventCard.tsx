import { type LucideIcon, MapPin, QrCode, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/types";

export default function EventCard({ event: { title, description } }: { event: Tables<"events"> }) {
  const metrics: { name: string; value: number; Icon: LucideIcon }[] = [
    { name: "Stands", value: 0, Icon: MapPin },
    { name: "Visitantes", value: 0, Icon: Users },
    { name: "Escaneos", value: 0, Icon: QrCode },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-3 gap-2 pt-1">
        {metrics.map(({ name, value, Icon }) => (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-2" key={name}>
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Icon className="h-3 w-3" />
              {name}
            </div>
            <p className="text-sm font-semibold mt-0.5">{value}</p>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button size="sm" className="flex-1" asChild>
          <Link href={`/dashboard/events`}>Gestionar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

import { Trophy } from "@nsmr/pixelart-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, isOrganizer } from "@/server/auth";
import { getEventSpots, getUserMedalHistory } from "@/server/spots";
import { cn } from "@/utils";

export default async function Perfil() {
  const user = await getCurrentUser();
  if (!user) return notFound();

  const [spots, history, isAdmin] = await Promise.all([
    getEventSpots(),
    getUserMedalHistory(user.id),
    isOrganizer(user.id),
  ]);

  const since = new Date(user.created_at).toLocaleDateString("es-AR", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <>
      <Card size="sm" className="highlight m-4">
        <CardContent className="grid gap-4 grid-cols-[auto_1fr] ">
          <Card className="p-0 h-fit w-fit row-span-1 sm:row-span-2 col-span-1">
            <Image
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata.full_name}
              width={100}
              height={100}
              loading="eager"
              decoding="sync"
            />
          </Card>

          <article className="min-w-0">
            <h2 className="font-press-start text-lg text-balance text-foreground">
              {user.user_metadata.full_name}
            </h2>
            <p className="text-xl text-pretty text-muted-foreground truncate">
              {user.email}
            </p>
          </article>

          <div className="space-x-2 flex items-center flex-wrap col-span-2 sm:col-span-1 gap-2">
            <Badge
              className={cn(
                "uppercase font-bold text-base",
                isAdmin ? "bg-amber-600" : "",
              )}
              variant="pixel"
            >
              {isAdmin ? "ADMIN" : "USUARIO"}
            </Badge>
            <span className="text-lg">Desde: {since}</span>
          </div>

          {isAdmin && (
            <div className="col-span-2 sm:col-span-1">
              <Button asChild className="w-full gap-2" size="sm">
                <Link href="/raffle">
                  <Trophy className="size-4" />
                  Ir al Sorteo
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card size="sm" className="my-4">
        <CardHeader>
          <CardTitle className="font-press-start text-secondary text-xl! text-center">
            Medallas obtenidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center">
          {spots.map(({ avatar_url, name, id }) => {
            const collected = history.some(
              (h) => !!h.collected_at && h.spot_id === id,
            );
            return (
              <div className="flex flex-col items-center gap-2 w-32" key={id}>
                <div
                  className={cn([
                    "flex items-center justify-center pixel-border-sm transition-all w-32 h-32 text-3xl bg-linear-to-br ",
                    collected
                      ? "from-medal-gold to-accent shadow-medal-gold shadow-sm"
                      : "bg-medal-locked grayscale opacity-50",
                  ])}
                >
                  <Image
                    src={avatar_url}
                    alt={name}
                    width={128}
                    height={128}
                    loading="eager"
                    decoding="sync"
                    className="w-full h-full object-cover opacity-85"
                  />
                </div>

                <p className="font-press-start text-[10px] text-center text-foreground w-full word-break">
                  {name}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}

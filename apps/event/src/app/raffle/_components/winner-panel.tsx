import { Trophy } from "@nsmr/pixelart-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RaffleParticipant } from "@/types";

interface WinnerPanelProps {
  /** Usuario a mostrar: el candidato mientras sortea, o el ganador al terminar. */
  displayUser: RaffleParticipant | null;
  winner: RaffleParticipant | null;
  isDrawing: boolean;
}

/** Panel que muestra el candidato durante el sorteo y el ganador al finalizar. */
export function WinnerPanel({
  displayUser,
  winner,
  isDrawing,
}: WinnerPanelProps) {
  return (
    <Card
      size="sm"
      className={winner ? "highlight" : isDrawing ? "animate-pulse" : ""}
    >
      <CardHeader>
        <CardTitle className="font-press-start text-lg">
          {winner ? "🎉 ¡GANADOR!" : isDrawing ? "⚡ SORTEANDO..." : "Sorteo"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4 min-h-48 flex-1">
        {displayUser ? (
          <div
            className={`text-center space-y-2 transition-all duration-100 ${isDrawing ? "scale-110" : ""}`}
          >
            {displayUser.user_avatar && (
              <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden bg-muted mb-2">
                <Image
                  src={displayUser.user_avatar}
                  alt={displayUser.user_name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p
              className={`text-lg ${winner ? "text-muted-foreground" : "text-accent font-bold"}`}
            >
              {winner ? "Ganador del sorteo" : "Candidato actual"}
            </p>
            <h3
              className={`font-press-start wrap-break-word transition-all ${
                winner
                  ? "text-xl text-secondary"
                  : "text-2xl text-secondary animate-pulse"
              }`}
            >
              {displayUser.user_name}
            </h3>
            <p className="text-lg text-muted-foreground">
              {displayUser.user_email}
            </p>
            <p className="text-base text-accent font-bold">
              Spots coleccionados: {displayUser.spot_count}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 h-full">
            <Trophy className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Presiona el botón para comenzar el sorteo
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

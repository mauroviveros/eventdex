"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { CelebrationConfetti } from "@/components/common/celebration-confetti";
import { Trophy, Copy } from "@nsmr/pixelart-react";

interface UserSpotCount {
  user_id: string;
  user_email: string;
  user_name: string;
  user_avatar: string;
  spot_count: number;
}

interface RaffleDrawerProps {
  participants: UserSpotCount[];
}

export function   RaffleDrawer({ participants }: RaffleDrawerProps) {
  const [winner, setWinner] = useState<UserSpotCount | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<UserSpotCount | null>(null);
  const [isPersistedWinner, setIsPersistedWinner] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cargar ganador guardado en localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem("raffle_winner");
      if (raw) {
        const parsed = JSON.parse(raw) as UserSpotCount;
        setWinner(parsed);
        setIsPersistedWinner(true);
      }
    } catch (err) {
      console.error("Error leyendo ganador guardado:", err);
    }
  }, []);

  // Persistir ganador en localStorage cuando cambie
  useEffect(() => {
    try {
      if (winner) {
        localStorage.setItem("raffle_winner", JSON.stringify(winner));
      } else {
        localStorage.removeItem("raffle_winner");
      }
    } catch (err) {
      console.error("Error guardando ganador:", err);
    }
  }, [winner]);

  const handleReset = () => {
    setWinner(null);
    setCurrentCandidate(null);
    setIsDrawing(false);
    setIsPersistedWinner(false);
    try {
      localStorage.removeItem("raffle_winner");
    } catch {}
  };

  const handleCopyEmails = async () => {
    const emailList = participants.map((p) => p.user_email).join("\n");
    try {
      await navigator.clipboard.writeText(emailList);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copiando emails:", err);
    }
  };

  const handleDraw = () => {
    if (participants.length === 0) return;

    setIsDrawing(true);
    setWinner(null);
    setCurrentCandidate(null);

    // Crear un array de "boletas" donde cada usuario tiene tantas boletas como spots coleccionados
    const tickets: UserSpotCount[] = [];
    participants.forEach((participant) => {
      for (let i = 0; i < participant.spot_count; i++) {
        tickets.push(participant);
      }
    });

    // Simulación visual del sorteo con aceleración
    const totalIterations = 80;
    let currentIteration = 0;

    const drawIteration = () => {
      const randomIndex = Math.floor(Math.random() * tickets.length);
      const candidate = tickets[randomIndex];
      setCurrentCandidate(candidate);

      currentIteration++;

      if (currentIteration >= totalIterations) {
        setWinner(candidate);
        setIsPersistedWinner(false);
        setCurrentCandidate(null);
        setIsDrawing(false);
      } else {
        // Easing: comenzar lento y acelerar
        const progress = currentIteration / totalIterations;
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const delay = 10 + (1 - easeOutQuad) * 120;

        setTimeout(drawIteration, delay);
      }
    };

    drawIteration();
  };

  const displayUser = winner || currentCandidate;

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel de participantes */}
        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-press-start text-lg">Participantes</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyEmails}
              className="gap-1"
            >
              <Copy className="size-4" />
              {copied ? "¡Copiado!" : "Copiar"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {participants.length === 0 ? (
                <p className="text-muted-foreground">No hay participantes</p>
              ) : (
                participants
                  .sort((a, b) => b.spot_count - a.spot_count)
                  .map((participant) => (
                    <div
                      key={participant.user_id}
                      className="flex items-center justify-between p-2 rounded bg-muted text-sm"
                    >
                      <span className="truncate font-press-start text-xs">{participant.user_name}</span>
                      <span className="ml-2 px-2 py-1 rounded bg-secondary text-secondary-foreground font-bold">
                        {participant.spot_count}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel de ganador */}
        <Card size="sm" className={winner ? "highlight" : isDrawing ? "animate-pulse" : ""}>
          <CardHeader>
            <CardTitle className="font-press-start text-lg">
              {winner ? "🎉 ¡GANADOR!" : isDrawing ? "⚡ SORTEANDO..." : "Sorteo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4 min-h-48 flex-1">
            {displayUser ? (
              <>
                <div className={`text-center space-y-2 transition-all duration-100 ${isDrawing ? "scale-110" : ""}`}>
                  {displayUser.user_avatar && (
                    <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden bg-muted mb-2">
                      <img
                        src={displayUser.user_avatar}
                        alt={displayUser.user_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className={`text-lg ${winner ? "text-muted-foreground" : "text-accent font-bold"}`}>
                    {winner ? "Ganador del sorteo" : "Candidato actual"}
                  </p>
                  <h3 className={`font-press-start wrap-break-word transition-all ${
                    winner ? "text-xl text-secondary" : "text-2xl text-secondary animate-pulse"
                  }`}>
                    {displayUser.user_name}
                  </h3>
                  <p className="text-lg text-muted-foreground">{displayUser.user_email}</p>
                  <p className="text-base text-accent font-bold">
                    Spots coleccionados: {displayUser.spot_count}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 h-full">
                <Trophy className="size-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">Presiona el botón para comenzar el sorteo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleDraw}
        disabled={isDrawing || participants.length === 0 || !!winner}
        className="w-full h-12 font-press-start text-lg"
      >
        {isDrawing ? "Sorteando..." : "INICIAR SORTEO"}
      </Button>

      {winner && (
        <>
          {!isPersistedWinner && <CelebrationConfetti trigger={!!winner && !isPersistedWinner} />}
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full font-press-start"
          >
            Nuevo sorteo
          </Button>
        </>
      )}
    </div>
  );
}

"use client";

import { CelebrationConfetti } from "@/components/celebration-confetti";
import { Button } from "@/components/ui/button";
import type { RaffleParticipant } from "@/types";
import { saveRaffleWinner } from "../actions";
import { ParticipantsPanel } from "./participants-panel";
import { useRaffleDraw } from "./use-raffle-draw";
import { WinnerPanel } from "./winner-panel";

interface RafflePanelProps {
  participants: RaffleParticipant[];
  initialWinner: RaffleParticipant | null;
}

export function RafflePanel({ participants, initialWinner }: RafflePanelProps) {
  const { winner, isDrawing, isPersistedWinner, displayUser, draw, reset } =
    useRaffleDraw(participants, {
      initialWinner,
      onWin: (nextWinner) => {
        // Persistimos en background; un fallo no debe cortar la celebración.
        saveRaffleWinner(nextWinner).catch((err) =>
          console.error("Error guardando ganador:", err),
        );
      },
    });

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ParticipantsPanel participants={participants} />
        <WinnerPanel
          displayUser={displayUser}
          winner={winner}
          isDrawing={isDrawing}
        />
      </div>

      <Button
        onClick={draw}
        disabled={isDrawing || participants.length === 0 || !!winner}
        className="w-full h-12 font-press-start text-lg"
      >
        {isDrawing ? "Sorteando..." : "INICIAR SORTEO"}
      </Button>

      {winner && (
        <>
          {/* Celebra solo un ganador recién sorteado, no uno persistido del server. */}
          {!isPersistedWinner && <CelebrationConfetti trigger />}
          <Button
            onClick={reset}
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

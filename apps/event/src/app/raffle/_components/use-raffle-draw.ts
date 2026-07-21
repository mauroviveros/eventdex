import { useState } from "react";
import type { RaffleParticipant } from "@/types";

interface Options {
  /** Ganador ya persistido (viene del server); no vuelve a celebrarse. */
  initialWinner: RaffleParticipant | null;
  /** Se llama al terminar el sorteo, para persistir el ganador server-side. */
  onWin: (winner: RaffleParticipant) => void;
}

/**
 * Lógica del sorteo: corre la animación de selección ponderada por cantidad de
 * spots y notifica el ganador para que se persista. El estado inicial viene del
 * server (fuente de verdad), así que sobrevive recargas y cambios de dispositivo.
 */
export function useRaffleDraw(
  participants: RaffleParticipant[],
  { initialWinner, onWin }: Options,
) {
  const [winner, setWinner] = useState<RaffleParticipant | null>(initialWinner);
  const [currentCandidate, setCurrentCandidate] =
    useState<RaffleParticipant | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  // Un ganador que ya venía persistido no dispara la celebración al cargar.
  const [isPersistedWinner, setIsPersistedWinner] = useState(
    initialWinner !== null,
  );

  const draw = () => {
    if (participants.length === 0) return;

    setIsDrawing(true);
    setWinner(null);
    setCurrentCandidate(null);

    // Cada usuario recibe tantas "boletas" como spots haya coleccionado.
    const tickets = participants.flatMap((participant) =>
      Array.from({ length: participant.spot_count }, () => participant),
    );

    // Animación visual: arranca lenta y acelera hacia el final.
    const totalIterations = 80;
    let iteration = 0;

    const step = () => {
      const candidate = tickets[Math.floor(Math.random() * tickets.length)];
      setCurrentCandidate(candidate);
      iteration++;

      if (iteration >= totalIterations) {
        setWinner(candidate);
        setIsPersistedWinner(false);
        setCurrentCandidate(null);
        setIsDrawing(false);
        onWin(candidate);
        return;
      }

      const progress = iteration / totalIterations;
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const delay = 10 + (1 - easeOutQuad) * 120;
      setTimeout(step, delay);
    };

    step();
  };

  // Reinicia la vista para volver a sortear. El ganador persistido sigue siendo
  // el actual hasta que un nuevo sorteo se complete.
  const reset = () => {
    setWinner(null);
    setCurrentCandidate(null);
    setIsDrawing(false);
    setIsPersistedWinner(false);
  };

  return {
    winner,
    isDrawing,
    isPersistedWinner,
    displayUser: winner ?? currentCandidate,
    draw,
    reset,
  };
}

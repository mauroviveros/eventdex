type Props = {
  claimed: number;
  total: number;
  /** Medals needed to enter the raffle. */
  goal: number;
  finished?: boolean;
};

/** Collection progress as a segmented bar: one segment per spot. */
export function Progress({ claimed, total, goal, finished = false }: Props) {
  const missing = Math.max(0, goal - claimed);
  const message = finished
    ? `El evento terminó. Juntaste ${claimed} de ${total}.`
    : claimed === 0
      ? "Todavía no tenés medallas. Escaneá el QR de cualquier stand para sumar la primera."
      : missing === 0
        ? "Cada medalla de más suma otra chance."
        : `Te ${missing === 1 ? "falta 1 medalla" : `faltan ${missing} medallas`} para entrar al sorteo.`;

  return (
    <section aria-label="Tu progreso" className="grid gap-3">
      <p className="flex items-baseline gap-2 font-display">
        <span className="text-px-3 tabular-nums">{claimed}</span>
        <span className="text-px-1 text-muted-foreground">
          de {total} medallas
        </span>
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={claimed}
        aria-valuetext={`${claimed} de ${total} medallas`}
        className="flex h-5 gap-0.5 border-2 border-lcd-3 p-0.5"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
            key={i}
            className={`flex-1 ${
              i < claimed ? "bg-lcd-3" : i < goal ? "bg-lcd-1" : ""
            }`}
          />
        ))}
      </div>
      <p className="grid gap-1 text-base">
        {missing === 0 && !finished && (
          <span className="font-display text-px-2">¡Entrás al sorteo!</span>
        )}
        {message}
      </p>
    </section>
  );
}

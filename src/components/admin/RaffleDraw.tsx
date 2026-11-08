import type { ReactNode } from "react";
import { formatMoment } from "@/domain/events";
import type { EventRaffle } from "@/lib/data/raffles";

type Props = {
  draw: EventRaffle["draws"][number];
  timezone: string;
  /** What can be done with it: voiding, in the panel. */
  children?: ReactNode;
};

/** One draw of a raffle: the winner to call out, or why it was voided. */
export function RaffleDraw({ draw, timezone, children }: Props) {
  const voided = draw.voided_at !== null;
  return (
    <li className="grid gap-3 border-t-2 border-lcd-2 py-4 first:border-t-0">
      <div className="grid gap-1">
        <p
          className={`font-display text-px-2 wrap-anywhere ${voided ? "text-muted-foreground line-through" : ""}`}
        >
          {draw.name}
        </p>
        {draw.email && draw.email !== draw.name && (
          <p className="truncate text-sm">{draw.email}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Extracción {draw.draw_number} ·{" "}
          {formatMoment(draw.drawn_at, timezone)} · entre{" "}
          {draw.eligible_count.toLocaleString("es-AR")}{" "}
          {draw.eligible_count === 1 ? "participante" : "participantes"}
        </p>
        {voided && (
          <p className="text-sm">
            <span className="font-display text-px-1 text-danger">Anulada</span>{" "}
            · {draw.void_reason}
          </p>
        )}
      </div>
      {children}
    </li>
  );
}

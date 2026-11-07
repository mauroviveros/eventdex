import type { Phase } from "@/domain/events";

const STYLES: Record<Phase, { label: string; className: string }> = {
  borrador: {
    label: "Borrador",
    className: "border-dashed border-lcd-2 text-lcd-2",
  },
  proximo: { label: "Próximo", className: "border-lcd-3 bg-lcd-1" },
  "en-curso": {
    label: "En curso",
    className: "border-lcd-3 bg-lcd-3 text-lcd-0",
  },
  finalizado: { label: "Finalizado", className: "border-lcd-2 text-lcd-2" },
  "sin-fecha": { label: "Sin fecha", className: "border-dashed border-lcd-3" },
};

export function PhaseBadge({ phase }: { phase: Phase }) {
  const { label, className } = STYLES[phase];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 px-2 py-0.5 font-display text-px-1 ${className}`}
    >
      {phase === "en-curso" && (
        <span aria-hidden className="size-2 animate-blink bg-lcd-0" />
      )}
      {label}
    </span>
  );
}

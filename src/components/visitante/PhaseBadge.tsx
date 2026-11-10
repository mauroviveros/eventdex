import { Badge } from "@/components/ui/shadcn/badge";
import type { Phase } from "@/domain/events";

const STYLES: Record<
  Phase,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "muted";
    dashed?: true;
  }
> = {
  borrador: { label: "Borrador", variant: "muted", dashed: true },
  proximo: { label: "Próximo", variant: "secondary" },
  "en-curso": { label: "En curso", variant: "default" },
  finalizado: { label: "Finalizado", variant: "muted" },
  "sin-fecha": { label: "Sin fecha", variant: "outline", dashed: true },
};

/** An event's phase as a shadcn Badge. In curso blinks a pixel, like a live light. */
export function PhaseBadge({ phase }: { phase: Phase }) {
  const { label, variant, dashed } = STYLES[phase];
  return (
    <Badge variant={variant} className={dashed ? "border-dashed" : ""}>
      {phase === "en-curso" && (
        <span aria-hidden className="size-2 animate-blink bg-lcd-0" />
      )}
      {label}
    </Badge>
  );
}

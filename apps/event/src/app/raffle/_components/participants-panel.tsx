"use client";

import { Copy } from "@nsmr/pixelart-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RaffleParticipant } from "@/types";

/** Panel con la lista de participantes (ordenada por spots) y copia de emails. */
export function ParticipantsPanel({
  participants,
}: {
  participants: RaffleParticipant[];
}) {
  const [copied, setCopied] = useState(false);

  const copyEmails = async () => {
    try {
      const emails = participants.map((p) => p.user_email).join("\n");
      await navigator.clipboard.writeText(emails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copiando emails:", err);
    }
  };

  // Copia antes de ordenar para no mutar el array recibido por props.
  const sorted = [...participants].sort((a, b) => b.spot_count - a.spot_count);

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-press-start text-lg">
          Participantes
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={copyEmails}
          className="gap-1"
        >
          <Copy className="size-4" />
          {copied ? "¡Copiado!" : "Copiar"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="text-muted-foreground">No hay participantes</p>
          ) : (
            sorted.map((participant) => (
              <div
                key={participant.user_id}
                className="flex items-center justify-between p-2 rounded bg-muted text-sm"
              >
                <span className="truncate font-press-start text-xs">
                  {participant.user_name}
                </span>
                <span className="ml-2 px-2 py-1 rounded bg-secondary text-secondary-foreground font-bold">
                  {participant.spot_count}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

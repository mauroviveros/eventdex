"use client";

import { type RefObject, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { publishEventAction } from "@/lib/actions/events";

type Event = { id: string; title: string };

/**
 * Asks before publishing: a published event can't go back to draft. Opened
 * from the event's ⋮ or from its Publicación section.
 */
export function PublishDialog({
  org,
  event,
  open,
  onOpenChange,
  returnFocus,
}: {
  org: string;
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      opener={returnFocus}
      title={`Publicar ${event.title}`}
      message="Aparece en el dominio de la organización y ya no vuelve a ser borrador."
      label="Sí, publicar"
      pendingLabel="Publicando…"
      variant="primary"
      action={publishEventAction}
      fields={{ org, eventId: event.id }}
      done={`${event.title} está publicado.`}
    />
  );
}

/**
 * The Publicación section's button: the same question as the ⋮. Publishing
 * removes the section, so the focus lands on the page's title.
 */
export function PublishButton({ org, event }: { org: string; event: Event }) {
  const [asking, setAsking] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={button} onClick={() => setAsking(true)}>
        Publicar
      </Button>
      <PublishDialog
        org={org}
        event={event}
        open={asking}
        onOpenChange={setAsking}
        returnFocus={button}
      />
    </>
  );
}

"use client";

import {
  type RefObject,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/shadcn/alert-dialog";
import { publishEventAction } from "@/lib/actions/events";

type Event = { id: string; title: string };

/**
 * Asks before publishing: a published event can't go back to draft. Opened
 * from the event's ⋮ or from its Publicación section; the focus goes back to
 * `returnFocus` when it closes.
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
  const [pending, setPending] = useState(false);
  return (
    <AlertDialog
      open={open}
      // Escape can't close it mid-action: it would look cancelled.
      onOpenChange={(next) => pending || onOpenChange(next)}
    >
      <AlertDialogContent
        // From the ⋮, the menu is gone by now: back to the button that opened it.
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        <AlertDialogTitle>Publicar {event.title}</AlertDialogTitle>
        <AlertDialogDescription>
          Aparece en el dominio de la organización y ya no vuelve a ser
          borrador.
        </AlertDialogDescription>
        <PublishForm
          org={org}
          event={event}
          onPending={setPending}
          onDone={onOpenChange}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The Publicación section's button: the same question as the ⋮. */
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

/**
 * The dialog's form. It mounts each time the dialog opens, so an error from a
 * previous try doesn't greet the next one.
 */
function PublishForm({
  org,
  event,
  onPending,
  onDone,
}: {
  org: string;
  event: Event;
  /** Stable (a state setter): the effect below must not re-run on renders. */
  onPending: (pending: boolean) => void;
  onDone: (open: false) => void;
}) {
  const [state, publish, pending] = useActionState(publishEventAction, null);

  useEffect(() => onPending(pending), [pending, onPending]);
  useEffect(() => {
    if (state?.ok) {
      onDone(false);
      toast.success(`${event.title} está publicado.`);
    }
  }, [state, event.title, onDone]);

  return (
    <>
      {state && !state.ok && (
        <FormMessage tone="error">{state.error}</FormMessage>
      )}
      <form action={publish} className="flex flex-wrap gap-2">
        <input type="hidden" name="org" value={org} />
        <input type="hidden" name="eventId" value={event.id} />
        <Button type="submit" pending={pending} pendingLabel="Publicando…">
          Sí, publicar
        </Button>
        <AlertDialogCancel asChild>
          <Button variant="secondary" disabled={pending}>
            Cancelar
          </Button>
        </AlertDialogCancel>
      </form>
    </>
  );
}

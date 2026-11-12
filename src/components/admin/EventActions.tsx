"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PixelIcon } from "@/components/pixel/icons";
import { Button, buttonClass } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/shadcn/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { publishEventAction } from "@/lib/actions/events";

type Props = {
  org: string;
  event: { id: string; slug: string; title: string; draft: boolean };
  /** Has spots in it: there is a QR sheet to print. */
  hasSpots: boolean;
  /** A draft with at least one schedule can be published. */
  ready: boolean;
  /** Its public page on the org's domain, once published. */
  publicUrl: string | null;
  /** Support mode: only what changes nothing. */
  support: boolean;
};

/**
 * An event's actions behind a ⋮ button: on its card in the dashboard and in
 * its own header. Each one shows only when it makes sense for this event;
 * publishing asks first, since a published event can't go back to draft.
 */
export function EventActions({
  org,
  event,
  hasSpots,
  ready,
  publicUrl,
  support,
}: Props) {
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const base = `/panel/${org}/eventos/${event.slug}`;

  return (
    <>
      {/* modal={false}: the menu hands the focus over to the dialog cleanly. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          ref={trigger}
          className={buttonClass("secondary", "w-11 shrink-0 px-0")}
          aria-label={`Acciones de ${event.title}`}
        >
          <PixelIcon name="acciones" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {hasSpots && (
            <DropdownMenuItem asChild>
              <Link href={`${base}/qr`}>Hoja de QR</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={`${base}/sorteo`}>Sorteo</Link>
          </DropdownMenuItem>
          {publicUrl && (
            <DropdownMenuItem asChild>
              <a href={publicUrl} target="_blank" rel="noopener">
                Ver en el sitio
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </DropdownMenuItem>
          )}
          {!support && event.draft && ready && (
            <DropdownMenuItem onSelect={() => setAsking(true)}>
              Publicar
            </DropdownMenuItem>
          )}
          {!support && (
            <DropdownMenuItem asChild>
              <Link href={`/panel/${org}/eventos/nuevo?desde=${event.slug}`}>
                Duplicar
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={asking}
        // Escape can't close it mid-action: it would look cancelled.
        onOpenChange={(open) => pending || setAsking(open)}
      >
        <AlertDialogContent
          // Opened from the menu, which is gone by now: back to the ⋮.
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            trigger.current?.focus();
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
            onDone={setAsking}
          />
        </AlertDialogContent>
      </AlertDialog>
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
  event: Props["event"];
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

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PixelIcon } from "@/components/pixel/icons";
import { buttonClass } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { PublishDialog } from "./PublishEvent";

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
            <Link href={`${base}?tab=sorteo`}>Sorteo</Link>
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

      <PublishDialog
        org={org}
        event={event}
        open={asking}
        onOpenChange={setAsking}
        returnFocus={trigger}
      />
    </>
  );
}

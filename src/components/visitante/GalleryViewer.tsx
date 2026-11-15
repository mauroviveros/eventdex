"use client";

import { Dialog } from "radix-ui";
import { useRef, useState } from "react";
import { Chevron } from "@/components/pixel/Chevron";
import { buttonClass } from "@/components/ui/Button";

export type GalleryPhoto = { id: string; src: string; caption: string | null };

/** Swiping this many px sideways, mostly sideways, walks the gallery. */
const SWIPE_PX = 50;

/**
 * On a phone the photo takes the whole screen and the plate is a bar over its
 * foot; from `sm` up it is a dialog with the photo whole and the plate beside it.
 */
const LOOK = {
  content:
    "fixed inset-0 z-50 grid bg-lcd-3 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[92dvh] sm:w-[min(94vw,64rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:grid-cols-[minmax(0,1fr)_17rem] sm:border-2 sm:border-lcd-3 sm:bg-background",
  stage:
    "grid min-h-0 touch-pan-y place-items-center p-2 pb-28 sm:bg-lcd-3 sm:pb-2",
  img: "max-h-full max-w-full object-contain sm:max-h-[88dvh]",
  plate:
    "absolute inset-x-0 bottom-0 grid gap-3 border-t-2 border-lcd-3 bg-background p-4 sm:static sm:content-between sm:gap-4 sm:border-t-0 sm:border-l-2",
};

/**
 * The event's photos as thumbnails; tapping one opens it whole, with its
 * caption on an LCD plate, and the gallery is walked from there.
 */
export function GalleryViewer({ photos }: { photos: readonly GalleryPhoto[] }) {
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);
  // Closing gives the focus back to the thumbnail of the photo they ended on:
  // Safari does not focus a button on tap, so the browser's own return lands nowhere.
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastShown = useRef(0);
  const [index, setIndex] = useState<number | null>(null);
  const photo = index === null ? undefined : photos[index];
  const last = photos.length - 1;
  if (index !== null) lastShown.current = index;
  const go = (step: number) =>
    setIndex((i) => (i === null ? i : Math.min(last, Math.max(0, i + step))));

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id}>
            <figure className="grid gap-1">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`Ampliar foto ${i + 1} de ${photos.length}${p.caption ? `: ${p.caption}` : ""}`}
                ref={(el) => {
                  thumbs.current[i] = el;
                }}
                onClick={() => setIndex(i)}
                className="block min-h-11 cursor-zoom-in"
              >
                {/* biome-ignore lint/performance/noImgElement: photos come from Storage, at most 1.5 MB; next/image adds nothing here */}
                <img
                  src={p.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full border-2 border-lcd-3 object-cover"
                />
              </button>
              {p.caption && (
                <figcaption className="text-sm">{p.caption}</figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>
      <Dialog.Root
        open={photo !== undefined}
        onOpenChange={(o) => !o && setIndex(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-lcd-3/60" />
          <Dialog.Content
            aria-describedby={undefined}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              thumbs.current[lastShown.current]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") go(-1);
              if (e.key === "ArrowRight") go(1);
            }}
            className={LOOK.content}
          >
            {photo && index !== null && (
              <>
                <div
                  className={LOOK.stage}
                  onPointerDown={(e) => {
                    if (e.pointerType === "touch")
                      swipeFrom.current = { x: e.clientX, y: e.clientY };
                  }}
                  onPointerUp={(e) => {
                    const from = swipeFrom.current;
                    swipeFrom.current = null;
                    if (!from) return;
                    const dx = e.clientX - from.x;
                    const dy = e.clientY - from.y;
                    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy))
                      go(dx < 0 ? 1 : -1);
                  }}
                  onPointerCancel={() => {
                    swipeFrom.current = null;
                  }}
                >
                  {/* biome-ignore lint/performance/noImgElement: same Storage file the thumbnail opens */}
                  <img src={photo.src} alt="" className={LOOK.img} />
                </div>
                <div className={LOOK.plate}>
                  <Dialog.Title className="font-display text-px-2 text-balance">
                    {photo.caption ?? `Foto ${index + 1}`}
                  </Dialog.Title>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-display text-px-1 tabular-nums">
                      {index + 1} de {photos.length}
                    </span>
                    <div className="flex gap-2">
                      {/* aria-disabled, not disabled: the focus stays on the button at the end of the gallery, so the arrow keys keep working */}
                      <button
                        type="button"
                        aria-label="Foto anterior"
                        aria-disabled={index === 0}
                        onClick={() => go(-1)}
                        className={buttonClass(
                          "secondary",
                          "min-w-11 aria-disabled:pointer-events-none aria-disabled:opacity-50",
                        )}
                      >
                        <Chevron className="rotate-90" />
                      </button>
                      <button
                        type="button"
                        aria-label="Foto siguiente"
                        aria-disabled={index === last}
                        onClick={() => go(1)}
                        className={buttonClass(
                          "secondary",
                          "min-w-11 aria-disabled:pointer-events-none aria-disabled:opacity-50",
                        )}
                      >
                        <Chevron className="-rotate-90" />
                      </button>
                      <Dialog.Close className={buttonClass("primary")}>
                        Cerrar
                      </Dialog.Close>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

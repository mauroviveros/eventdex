"use client";

import {
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { Chevron } from "@/components/pixel/Chevron";
import { FormMessage } from "@/components/ui/Field";
import { moveFaqAction } from "@/lib/actions/event-page";
import { FaqRow } from "./PageForms";

type Faq = { id: string; question: string; answer: string };
type Dir = "up" | "down";

function swap<T>(list: readonly T[], i: number, by: -1 | 1) {
  const next = [...list];
  const [item] = next.splice(i, 1);
  next.splice(i + by, 0, item as T);
  return next;
}

/** One arrow: half the column's height, or all of it when it's the only one. */
function Arrow({
  dir,
  alone,
  label,
  busy,
  onClick,
}: {
  dir: Dir;
  alone: boolean;
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={busy || undefined}
      data-arrow={dir}
      onClick={onClick}
      className={`${alone ? "h-12" : "h-6"} flex w-11 shrink-0 items-center justify-center border-2 border-lcd-3 hover:bg-lcd-1 focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:opacity-50`}
    >
      <Chevron className={dir === "up" ? "rotate-180" : ""} />
    </button>
  );
}

/**
 * The event's questions, in the order the public page shows them. Each one
 * moves a place up or down with its ▲▼ buttons, no dragging: it works on a
 * phone and with the keyboard. The list moves at once and goes back, with the
 * error, if saving fails.
 */
export function FaqList({ org, faqs }: { org: string; faqs: Faq[] }) {
  const [state, run, pending] = useActionState(moveFaqAction, null);
  const [, startTransition] = useTransition();
  const [list, moveOptimistic] = useOptimistic(
    faqs,
    (current, move: { id: string; by: -1 | 1 }) => {
      const i = current.findIndex((f) => f.id === move.id);
      return i < 0 || !current[i + move.by]
        ? current
        : swap(current, i, move.by);
    },
  );
  const [said, setSaid] = useState("");
  const focus = useRef<{ id: string; dir: Dir } | null>(null);
  const last = list.length - 1;

  // The moved question keeps the focus, on the arrow it has left.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the order changes
  useEffect(() => {
    const target = focus.current;
    if (!target) return;
    focus.current = null;
    const row = document.querySelector(`[data-faq="${target.id}"]`);
    const arrow = row?.querySelector<HTMLElement>(
      `[data-arrow="${target.dir}"]`,
    );
    (arrow ?? row?.querySelector<HTMLElement>("[data-arrow]"))?.focus();
  }, [list]);

  const shift = (i: number, dir: Dir) => {
    if (pending) return;
    const faq = list[i];
    if (!faq) return;
    const by = dir === "up" ? -1 : 1;
    const data = new FormData();
    data.set("org", org);
    data.set("faqId", faq.id);
    data.set("direction", dir);
    focus.current = { id: faq.id, dir };
    setSaid(`«${faq.question}» pasó al lugar ${i + by + 1} de ${list.length}.`);
    startTransition(() => {
      moveOptimistic({ id: faq.id, by });
      run(data);
    });
  };

  return (
    <>
      <ol className="grid gap-2" aria-busy={pending || undefined}>
        {list.map((f, i) => (
          <li key={f.id} data-faq={f.id} className="flex items-start gap-2">
            {list.length > 1 && (
              <div className="flex shrink-0 flex-col">
                {i > 0 && (
                  <Arrow
                    dir="up"
                    alone={i === last}
                    busy={pending}
                    label={`Subir «${f.question}»`}
                    onClick={() => shift(i, "up")}
                  />
                )}
                {i < last && (
                  <Arrow
                    dir="down"
                    alone={i === 0}
                    busy={pending}
                    label={`Bajar «${f.question}»`}
                    onClick={() => shift(i, "down")}
                  />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <FaqRow org={org} faq={f} />
            </div>
          </li>
        ))}
      </ol>
      {!pending && state && !state.ok && (
        <FormMessage tone="error">{state.error}</FormMessage>
      )}
      <p role="status" className="sr-only">
        {said}
      </p>
    </>
  );
}

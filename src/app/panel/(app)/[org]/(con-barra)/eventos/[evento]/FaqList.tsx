"use client";

// shortcut: the order lives in local state and isn't saved, wire it to the
// move action in the Backend block.

import { useState } from "react";
import { Chevron } from "@/components/pixel/Chevron";
import { FaqRow } from "./PageForms";

type Faq = { id: string; question: string; answer: string };

function move<T>(list: readonly T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/** One arrow: half the column's height, or all of it when it's the only one. */
function Arrow({
  dir,
  alone,
  label,
  onClick,
}: {
  dir: "up" | "down";
  alone: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`${alone ? "h-12" : "h-6"} flex w-11 shrink-0 items-center justify-center border-2 border-lcd-3 hover:bg-lcd-1 focus-visible:outline-2 focus-visible:outline-offset-2`}
    >
      <Chevron className={dir === "up" ? "rotate-180" : ""} />
    </button>
  );
}

/**
 * The event's questions, in the order the public page shows them. Each row
 * moves up or down with its ▲▼ buttons, no dragging: it works on a phone and
 * with the keyboard.
 */
export function FaqList({ org, faqs }: { org: string; faqs: Faq[] }) {
  const [order, setOrder] = useState(faqs.map((f) => f.id));
  const [said, setSaid] = useState("");

  // What the staff ordered, minus what was removed, plus what was just added.
  const byId = new Map(faqs.map((f) => [f.id, f]));
  const known = new Set(order);
  const ids = [
    ...order.filter((id) => byId.has(id)),
    ...faqs.filter((f) => !known.has(f.id)).map((f) => f.id),
  ];
  const list = ids.flatMap((id) => byId.get(id) ?? []);
  const last = list.length - 1;

  const shift = (i: number, by: -1 | 1) => {
    setOrder(move(ids, i, i + by));
    setSaid(
      `«${list[i]?.question}» pasó al lugar ${i + by + 1} de ${list.length}.`,
    );
  };

  return (
    <>
      <ol className="grid gap-2">
        {list.map((f, i) => (
          <li key={f.id} className="flex items-start gap-2">
            {list.length > 1 && (
              <div className="flex shrink-0 flex-col">
                {i > 0 && (
                  <Arrow
                    dir="up"
                    alone={i === last}
                    label={`Subir «${f.question}»`}
                    onClick={() => shift(i, -1)}
                  />
                )}
                {i < last && (
                  <Arrow
                    dir="down"
                    alone={i === 0}
                    label={`Bajar «${f.question}»`}
                    onClick={() => shift(i, 1)}
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
      <p role="status" className="sr-only">
        {said}
      </p>
    </>
  );
}

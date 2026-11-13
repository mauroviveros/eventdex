"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { PixelIcon } from "@/components/pixel/icons";
import { buttonClass } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import type { FormState } from "@/lib/actions/form";

export type RowAction = {
  label: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Hidden fields the action reads (org, id…). */
  fields: Record<string, string>;
  /** The toast when it works ("Rol cambiado."). */
  done: string;
  /**
   * Ask first, for what can't be undone: the dialog's title names the action
   * and its object, the message the consequence, `label` the explicit button.
   */
  confirm?: { title: string; message: string; label: string; pending: string };
};

const formData = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};

/**
 * A row's actions behind a ⋮ (a team member, an invitation). Each one runs its
 * Server Action; the result is a toast, and what can't be undone asks first
 * in a ConfirmDialog, which keeps its error and brings the focus back to the
 * ⋮, or to `fallbackFocus` when the row is gone.
 */
export function RowActions({
  name,
  actions,
  fallbackFocus,
}: {
  /** What the row is, for the button's name: "Acciones de Martín". */
  name: string;
  actions: RowAction[];
  /** Id of what takes the focus when an action removes this row. */
  fallbackFocus?: string;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [asking, setAsking] = useState<RowAction | null>(null);
  const [pending, start] = useTransition();

  // Without a question: run it, and say how it went in a toast.
  const run = (item: RowAction) =>
    start(async () => {
      const result = await item.action(null, formData(item.fields));
      if (result && !result.ok) toast.error(result.error);
      else toast.success(item.done);
    });

  return (
    <>
      {/* modal={false}: the menu hands the focus over to the dialog cleanly. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          ref={trigger}
          disabled={pending}
          className={buttonClass("secondary", "w-11 shrink-0 px-0")}
          aria-label={`Acciones de ${name}`}
        >
          <PixelIcon name="acciones" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {actions.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onSelect={() => (item.confirm ? setAsking(item) : run(item))}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {asking?.confirm && (
        <ConfirmDialog
          open
          onOpenChange={(open) => open || setAsking(null)}
          opener={trigger}
          fallbackFocus={fallbackFocus}
          title={asking.confirm.title}
          message={asking.confirm.message}
          label={asking.confirm.label}
          pendingLabel={asking.confirm.pending}
          action={asking.action}
          fields={asking.fields}
          done={asking.done}
        />
      )}
    </>
  );
}

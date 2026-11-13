"use client";

import { useRef, useState, useTransition } from "react";
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
 * in a dialog that keeps its error. The focus goes back to the ⋮.
 */
export function RowActions({
  name,
  actions,
}: {
  /** What the row is, for the button's name: "Acciones de Martín". */
  name: string;
  actions: RowAction[];
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [asking, setAsking] = useState<RowAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (item: RowAction) =>
    start(async () => {
      const result = await item.action(null, formData(item.fields));
      if (result && !result.ok) {
        if (item.confirm) setError(result.error);
        else toast.error(result.error);
        return;
      }
      setAsking(null);
      toast.success(item.done);
    });

  return (
    <>
      {/* modal={false}: the menu hands the focus over to the dialog cleanly. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          ref={trigger}
          disabled={pending && !asking}
          className={buttonClass("secondary", "w-11 shrink-0 px-0")}
          aria-label={`Acciones de ${name}`}
        >
          <PixelIcon name="acciones" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {actions.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onSelect={() => {
                if (!item.confirm) return run(item);
                setError(null);
                setAsking(item);
              }}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={asking !== null}
        // Escape can't close it mid-action: it would look cancelled.
        onOpenChange={(open) => pending || open || setAsking(null)}
      >
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            trigger.current?.focus();
          }}
        >
          {asking?.confirm && (
            <>
              <AlertDialogTitle>{asking.confirm.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {asking.confirm.message}
              </AlertDialogDescription>
              {error && <FormMessage tone="error">{error}</FormMessage>}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="danger"
                  pending={pending}
                  pendingLabel={asking.confirm.pending}
                  onClick={() => run(asking)}
                >
                  {asking.confirm.label}
                </Button>
                <AlertDialogCancel asChild>
                  <Button variant="secondary" disabled={pending}>
                    Cancelar
                  </Button>
                </AlertDialogCancel>
              </div>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

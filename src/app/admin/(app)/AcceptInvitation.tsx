"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { acceptInvitationAction } from "@/lib/actions/organizations";

export function AcceptInvitation({ invitationId }: { invitationId: string }) {
  const [state, action, pending] = useActionState(acceptInvitationAction, null);
  return (
    <form action={action} className="grid justify-items-end gap-2">
      <input type="hidden" name="invitationId" value={invitationId} />
      <Button type="submit" pending={pending} pendingLabel="Aceptando…">
        Aceptar invitación
      </Button>
      {state && !state.ok && (
        <p role="alert" className="max-w-xs text-right text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}

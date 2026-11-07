"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";
import { setSpotArchivedAction } from "@/lib/actions/spots";

/** Archive (or bring back) a catalog spot. Past events keep it. */
export function ArchiveSpotButton({
  org,
  id,
  archived,
}: {
  org: string;
  id: string;
  archived: boolean;
}) {
  const [state, action, pending] = useActionState(setSpotArchivedAction, null);
  return (
    <form action={action} className="grid justify-items-start gap-2">
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="archived" value={archived ? "0" : "1"} />
      <Button
        type="submit"
        variant="secondary"
        pending={pending}
        pendingLabel={archived ? "Desarchivando…" : "Archivando…"}
      >
        {archived ? "Desarchivar" : "Archivar"}
      </Button>
      {state && !state.ok && (
        <FormMessage tone="error">{state.error}</FormMessage>
      )}
    </form>
  );
}

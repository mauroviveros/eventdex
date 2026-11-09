"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { inviteMemberAction } from "@/lib/actions/team";

export function InviteForm({ org }: { org: { id: string; slug: string } }) {
  const [state, action, pending] = useActionState(inviteMemberAction, null);
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org.slug} />
      <input type="hidden" name="organizationId" value={org.id} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      {state?.ok && (
        <FormMessage tone="success">
          Invitación creada. Avisale que entre al panel con ese mail.
        </FormMessage>
      )}
      <Field
        label="Mail"
        name="email"
        type="email"
        autoComplete="off"
        defaultValue={values.email}
        required
        hint="No le mandamos ningún mail. La invitación se acepta sola cuando entra con esta dirección, y vence a los 14 días."
        error={fields.email}
      />
      <SelectField
        label="Rol"
        name="role"
        defaultValue={values.role ?? "staff"}
        hint="El staff opera los eventos. El owner además maneja el equipo, la marca y los dominios."
        error={fields.role}
      >
        <option value="staff">Staff</option>
        <option value="owner">Owner</option>
      </SelectField>
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Invitando…"
        className="justify-self-start"
      >
        Invitar
      </Button>
    </form>
  );
}

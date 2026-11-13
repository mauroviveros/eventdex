"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { announce, useFormFeedback } from "@/components/ui/useFormFeedback";
import { createInvoiceAction } from "@/lib/actions/platform";

type Props = {
  organizations: { id: string; name: string }[];
  today: string;
};

export function NewInvoiceForm({ organizations, today }: Props) {
  const [state, action, pending] = useActionState(
    announce(createInvoiceAction, "Factura registrada."),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <SelectField
        label="Organización"
        name="organizationId"
        defaultValue={values.organizationId ?? ""}
        error={fields.organizationId}
      >
        <option value="" disabled>
          Elegí una
        </option>
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </SelectField>
      <Field
        label="Concepto"
        name="concept"
        defaultValue={values.concept}
        required
        placeholder="Expo 2026"
        error={fields.concept}
      />
      <div className="grid gap-6 sm:grid-cols-3">
        <Field
          label="Monto"
          name="amount"
          defaultValue={values.amount}
          required
          inputMode="decimal"
          placeholder="1.500,50"
          error={fields.amount}
        />
        <SelectField
          label="Moneda"
          name="currency"
          defaultValue={values.currency ?? "ARS"}
          error={fields.currency}
        >
          <option value="ARS">Pesos (ARS)</option>
          <option value="USD">Dólares (USD)</option>
        </SelectField>
        <DateField
          label="Fecha"
          name="issuedOn"
          defaultValue={values.issuedOn ?? today}
          error={fields.issuedOn}
        />
      </div>
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Registrando…"
        className="justify-self-start"
      >
        Registrar factura
      </Button>
    </form>
  );
}

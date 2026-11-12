"use client";

import { useActionState } from "react";
import { AlertIcon } from "@/components/pixel/AlertIcon";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { createOrganizationAction } from "@/lib/actions/organizations";

export function NewOrganizationForm() {
  const [state, action, pending] = useActionState(
    createOrganizationAction,
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      {failed && !failed.fieldErrors && (
        <p role="alert" className="flex items-start gap-2 text-danger">
          <span className="mt-1">
            <AlertIcon />
          </span>
          {failed.error}
        </p>
      )}
      <Field
        label="Nombre"
        name="name"
        defaultValue={values.name}
        required
        autoComplete="organization"
        placeholder="Expo de Ejemplo"
        error={fields.name}
      />
      <Field
        label="Slug"
        name="slug"
        defaultValue={values.slug}
        required
        hint="Identificador en las URLs del panel. Minúsculas, números y guiones."
        placeholder="expo-ejemplo"
        error={fields.slug}
      />
      <Field
        label="Dominio"
        name="hostname"
        defaultValue={values.hostname}
        required
        hint="Donde se publica la app del evento. Sin https:// ni barras."
        placeholder="expo.com.ar"
        error={fields.hostname}
      />
      <Field
        label="Mail del owner"
        name="ownerEmail"
        defaultValue={values.ownerEmail}
        type="email"
        required
        hint="La invitación queda a nombre de este mail: el owner la ve al ingresar con él."
        error={fields.ownerEmail}
      />
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Creando…"
        className="justify-self-start"
      >
        Crear organización
      </Button>
    </form>
  );
}

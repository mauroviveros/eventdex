"use client";

import { useActionState, useState } from "react";
import { BrandPreview } from "@/components/admin/BrandPreview";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { LogoField } from "@/components/ui/LogoField";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import {
  removeLogoAction,
  updateSettingsAction,
  uploadLogoAction,
} from "@/lib/actions/settings";

type Ids = { org: string; organizationId: string };

function Hidden({ ids }: { ids: Ids }) {
  return (
    <>
      <input type="hidden" name="org" value={ids.org} />
      <input type="hidden" name="organizationId" value={ids.organizationId} />
    </>
  );
}

/** The form and, beside it, how the brand looks as it's edited. */
export function BrandEditor({
  ids,
  settings,
  logo,
  timezones,
}: {
  ids: Ids;
  settings: { name: string; color: string; timezone: string };
  logo: string | null;
  timezones: string[];
}) {
  const [state, action, pending] = useActionState(updateSettingsAction, null);
  const { form, failed, fields, values } = useFormFeedback(state);
  const [name, setName] = useState(settings.name);
  const [color, setColor] = useState(settings.color);

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_28rem] xl:items-start">
      <div className="panel grid gap-8 p-6">
        <form ref={form} action={action} className="grid gap-6" noValidate>
          <Hidden ids={ids} />
          {failed && !failed.fieldErrors && (
            <FormMessage tone="error">{failed.error}</FormMessage>
          )}
          {state?.ok && (
            <FormMessage tone="success">Cambios guardados.</FormMessage>
          )}
          <Field
            label="Nombre"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            error={fields.name}
          />
          <Field
            label="Color de marca"
            name="brandColor"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            hint="Tomamos el tono y armamos cuatro con buen contraste: cualquier color sirve."
            error={fields.brandColor}
          />
          <SelectField
            label="Zona horaria"
            name="defaultTimezone"
            defaultValue={values.defaultTimezone ?? settings.timezone}
            hint="La que se propone al crear una sede."
            error={fields.defaultTimezone}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replaceAll("_", " ")}
              </option>
            ))}
          </SelectField>
          <Button
            type="submit"
            pending={pending}
            pendingLabel="Guardando…"
            className="justify-self-start"
          >
            Guardar cambios
          </Button>
        </form>
        <LogoForm ids={ids} hasLogo={logo !== null} />
      </div>
      <div className="min-w-0 xl:order-first">
        <BrandPreview color={color} name={name} logo={logo} />
      </div>
    </div>
  );
}

function LogoForm({ ids, hasLogo }: { ids: Ids; hasLogo: boolean }) {
  const [state, action, pending] = useActionState(uploadLogoAction, null);
  const { form, failed, fields } = useFormFeedback(state);

  return (
    <div className="grid gap-4 border-t-2 border-lcd-3 pt-6">
      <form ref={form} action={action} className="grid gap-6" noValidate>
        <Hidden ids={ids} />
        {failed && !failed.fieldErrors && (
          <FormMessage tone="error">{failed.error}</FormMessage>
        )}
        {state?.ok && (
          <FormMessage tone="success">Logo actualizado.</FormMessage>
        )}
        <LogoField
          hint="PNG, JPG o WebP, hasta 1 MB. Se muestra tal cual lo subas."
          error={fields.logo}
        />
        <Button
          type="submit"
          variant="secondary"
          pending={pending}
          pendingLabel="Subiendo…"
          className="justify-self-start"
        >
          Subir logo
        </Button>
      </form>
      {hasLogo && (
        <ActionButton
          action={removeLogoAction}
          fields={ids}
          label="Quitar logo"
          pendingLabel="Quitando…"
          confirm={{
            message:
              "El logo se borra y vuelven las iniciales de tu organización.",
            label: "Sí, quitar",
          }}
        />
      )}
    </div>
  );
}

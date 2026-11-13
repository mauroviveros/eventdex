"use client";

import { type ReactNode, useActionState, useState } from "react";
import { BrandPreview } from "@/components/panel/BrandPreview";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, SelectField } from "@/components/ui/Field";
import { LogoField } from "@/components/ui/LogoField";
import { announce, useFormFeedback } from "@/components/ui/useFormFeedback";
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

/**
 * The org's settings in two sections, each with its own Guardar: Organización
 * (name and zone) and Marca (color and logo, beside how they look). The action
 * saves the three fields together, so each form sends the other's as saved.
 */
export function SettingsEditor({
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
  const [name, setName] = useState(settings.name);
  const [color, setColor] = useState(settings.color);

  return (
    <>
      <section aria-labelledby="organizacion" className="grid max-w-xl gap-4">
        <h2 id="organizacion" className="text-px-2">
          Organización
        </h2>
        <SettingsForm
          ids={ids}
          saved={settings}
          done="Datos guardados."
          submit="Guardar organización"
        >
          {({ fields, values }) => (
            <>
              <Field
                label="Nombre"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                error={fields.name}
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
            </>
          )}
        </SettingsForm>
      </section>

      <section aria-labelledby="marca" className="grid gap-4">
        <h2 id="marca" className="text-px-2">
          Marca
        </h2>
        <div className="grid gap-10 xl:grid-cols-[1fr_28rem] xl:items-start">
          <div className="panel grid gap-8 p-6">
            <SettingsForm
              ids={ids}
              saved={settings}
              done="Color guardado."
              submit="Guardar marca"
            >
              {({ fields }) => (
                <Field
                  label="Color de marca"
                  name="brandColor"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  hint="Tomamos el tono y armamos cuatro con buen contraste: cualquier color sirve."
                  error={fields.brandColor}
                />
              )}
            </SettingsForm>
            <LogoForm ids={ids} hasLogo={logo !== null} />
          </div>
          <div className="min-w-0 xl:order-first">
            <BrandPreview color={color} name={name} logo={logo} />
          </div>
        </div>
      </section>
    </>
  );
}

type Feedback = ReturnType<typeof useFormFeedback>;

/**
 * One section's form. The fields it doesn't render go as saved, since the
 * action takes the three; its own fields override them by coming later.
 */
function SettingsForm({
  ids,
  saved,
  done,
  submit,
  children,
}: {
  ids: Ids;
  saved: { name: string; color: string; timezone: string };
  done: string;
  /** The button's full name ("Guardar marca"): the page has two Guardar. */
  submit: string;
  children: (feedback: Pick<Feedback, "fields" | "values">) => ReactNode;
}) {
  const [state, action, pending] = useActionState(
    announce(updateSettingsAction, done),
    null,
  );
  const { form, failed, fields, values } = useFormFeedback(state);
  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <Hidden ids={ids} />
      <input type="hidden" name="name" value={saved.name} />
      <input type="hidden" name="brandColor" value={saved.color} />
      <input type="hidden" name="defaultTimezone" value={saved.timezone} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      {children({ fields, values })}
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Guardando…"
        className="justify-self-start"
        aria-label={submit}
      >
        Guardar
      </Button>
    </form>
  );
}

function LogoForm({ ids, hasLogo }: { ids: Ids; hasLogo: boolean }) {
  const [state, action, pending] = useActionState(
    announce(uploadLogoAction, "Logo actualizado."),
    null,
  );
  const { form, failed, fields } = useFormFeedback(state);

  return (
    <div className="grid gap-4 border-t-2 border-lcd-3 pt-6">
      <form ref={form} action={action} className="grid gap-6" noValidate>
        <Hidden ids={ids} />
        {failed && !failed.fieldErrors && (
          <FormMessage tone="error">{failed.error}</FormMessage>
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

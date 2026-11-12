"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Field, FormMessage } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Label } from "@/components/ui/shadcn/label";
import { useFormFeedback } from "@/components/ui/useFormFeedback";
import { addEventSpotAction, updateEventSpotAction } from "@/lib/actions/spots";

/** Puts a catalog spot in the event with its booth and points; the code is generated. */
export function AddEventSpotForm({
  org,
  eventId,
  spots,
}: {
  org: string;
  eventId: string;
  /** Catalog spots not archived and not in the event yet. */
  spots: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(addEventSpotAction, null);
  const { form, failed, fields, values } = useFormFeedback(
    state,
    "Spot agregado.",
  );

  return (
    <form ref={form} action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="eventId" value={eventId} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <Combobox
        key={values.spotId}
        label="Spot del catálogo"
        name="spotId"
        options={spots.map((s) => ({ value: s.id, label: s.name }))}
        placeholder="Elegí un spot"
        empty="Ningún spot del catálogo se llama así."
        defaultValue={values.spotId}
        error={fields.spotId}
      />
      <div className="grid gap-6 sm:grid-cols-[8rem_1fr]">
        <Field
          label="Puntos"
          name="points"
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          defaultValue={values.points ?? "1"}
          error={fields.points}
        />
        <Field
          label="Puesto"
          name="booth"
          defaultValue={values.booth}
          placeholder="Pabellón A · 12"
          hint="Opcional. Dónde está en el predio."
          error={fields.booth}
        />
      </div>
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Agregando…"
        className="justify-self-start"
      >
        Agregar al evento
      </Button>
    </form>
  );
}

type EventSpot = {
  id: string;
  code: string;
  booth: string | null;
  points: number;
  is_active: boolean;
  name_override: string | null;
  description_override: string | null;
};

/** Edits what this spot is in this edition: code, booth, points, active, and overrides. */
export function EditEventSpotForm({
  org,
  spot,
  catalogName,
}: {
  org: string;
  spot: EventSpot;
  catalogName: string;
}) {
  const [state, action, pending] = useActionState(updateEventSpotAction, null);
  const { form, failed, fields, values } = useFormFeedback(
    state,
    "Cambios guardados.",
  );
  // After a failed save, show what was typed (keyed by field name).
  const v = (field: string, saved: string | null) =>
    values[field] ?? saved ?? "";

  return (
    <form ref={form} action={action} className="grid gap-5" noValidate>
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="id" value={spot.id} />
      {failed && !failed.fieldErrors && (
        <FormMessage tone="error">{failed.error}</FormMessage>
      )}
      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Código"
          name="code"
          defaultValue={v("code", spot.code)}
          required
          autoCapitalize="characters"
          hint="Se imprime con el QR."
          error={fields.code}
        />
        <Field
          label="Puntos"
          name="points"
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          defaultValue={v("points", String(spot.points))}
          error={fields.points}
        />
        <Field
          label="Puesto"
          name="booth"
          defaultValue={v("booth", spot.booth)}
          error={fields.booth}
        />
      </div>
      <Field
        label="Nombre en este evento"
        name="nameOverride"
        defaultValue={v("nameOverride", spot.name_override)}
        placeholder={catalogName}
        hint="Opcional. Si lo dejás vacío, se usa el del catálogo."
        error={fields.nameOverride}
      />
      <Field
        label="Descripción en este evento"
        name="descriptionOverride"
        defaultValue={v("descriptionOverride", spot.description_override)}
        hint="Opcional."
        error={fields.descriptionOverride}
      />
      <Label className="min-h-11 font-sans text-base">
        <Checkbox name="isActive" defaultChecked={spot.is_active} />
        <span>
          Activo: su QR entrega medalla. Desactivalo si el stand no vino.
        </span>
      </Label>
      <Button
        type="submit"
        pending={pending}
        pendingLabel="Guardando…"
        className="justify-self-start"
      >
        Guardar
      </Button>
    </form>
  );
}

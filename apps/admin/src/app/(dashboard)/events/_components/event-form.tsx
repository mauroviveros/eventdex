"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EventFormState } from "../actions";

const TIMEZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  "America/Santiago",
  "America/Asuncion",
  "America/Sao_Paulo",
  "America/La_Paz",
  "America/Lima",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
  "Europe/Madrid",
  "UTC",
];

export type EventFormDefaults = {
  title?: string;
  description?: string;
  edition?: string | null;
  timezone?: string;
  siteUrl?: string | null;
  location?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  } | null;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}

export function EventForm({
  action,
  defaults,
  submitLabel,
  withSchedule = false,
}: {
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  defaults?: EventFormDefaults;
  submitLabel: string;
  withSchedule?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const errors = state?.errors ?? {};
  const timezone = defaults?.timezone ?? "America/Argentina/Buenos_Aires";
  const timezones = TIMEZONES.includes(timezone)
    ? TIMEZONES
    : [timezone, ...TIMEZONES];

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Evento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              defaultValue={defaults?.title}
              required
            />
            <FieldError message={errors.title} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={defaults?.description}
              required
              rows={3}
            />
            <FieldError message={errors.description} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edition">Edición (opcional)</Label>
              <Input
                id="edition"
                name="edition"
                defaultValue={defaults?.edition ?? ""}
                placeholder="2027"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select name="timezone" defaultValue={timezone}>
                <SelectTrigger id="timezone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.timezone} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="site_url">URL pública del evento (opcional)</Label>
            <Input
              id="site_url"
              name="site_url"
              type="url"
              defaultValue={defaults?.siteUrl ?? ""}
              placeholder="https://mievento.com"
            />
            <p className="text-muted-foreground text-xs">
              El deploy de la app del evento. Se usa para armar los links y QR
              de los spots.
            </p>
            <FieldError message={errors.site_url} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="location_name">Nombre del lugar</Label>
            <Input
              id="location_name"
              name="location_name"
              defaultValue={defaults?.location?.name}
              required
            />
            <FieldError message={errors.location_name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location_address">Dirección</Label>
            <Input
              id="location_address"
              name="location_address"
              defaultValue={defaults?.location?.address}
              required
            />
            <FieldError message={errors.location_address} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="location_city">Ciudad</Label>
              <Input
                id="location_city"
                name="location_city"
                defaultValue={defaults?.location?.city}
                required
              />
              <FieldError message={errors.location_city} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location_state">Provincia</Label>
              <Input
                id="location_state"
                name="location_state"
                defaultValue={defaults?.location?.state}
                required
              />
              <FieldError message={errors.location_state} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location_country">País</Label>
              <Input
                id="location_country"
                name="location_country"
                defaultValue={defaults?.location?.country}
                required
              />
              <FieldError message={errors.location_country} />
            </div>
          </div>
        </CardContent>
      </Card>

      {withSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Primer horario</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="start_datetime">Inicio</Label>
                <Input
                  id="start_datetime"
                  name="start_datetime"
                  type="datetime-local"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_datetime">Fin</Label>
                <Input
                  id="end_datetime"
                  name="end_datetime"
                  type="datetime-local"
                  required
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              En el timezone del evento. Después podés agregar más horarios
              desde el detalle.
            </p>
            <FieldError message={errors.schedule} />
          </CardContent>
        </Card>
      )}

      <FieldError message={errors._form} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

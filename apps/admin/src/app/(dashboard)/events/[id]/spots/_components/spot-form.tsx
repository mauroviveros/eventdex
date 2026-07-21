"use client";

import Image from "next/image";
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
import { AVATAR_ACCEPT } from "@/server/spot-form";
import type { SpotFormState } from "../actions";

export type SpotFormDefaults = {
  name?: string;
  description?: string;
  location?: string;
  type?: "LOCAL" | "ATTRACTION" | null;
  avatarUrl?: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}

export function SpotForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: SpotFormState, formData: FormData) => Promise<SpotFormState>;
  defaults?: SpotFormDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const errors = state?.errors ?? {};
  const isEdit = Boolean(defaults?.avatarUrl);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Spot</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaults?.name}
              required
            />
            <FieldError message={errors.name} />
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
              <Label htmlFor="location">
                Ubicación en el evento (opcional)
              </Label>
              <Input
                id="location"
                name="location"
                defaultValue={defaults?.location}
                placeholder="Stand 4"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select name="type" defaultValue={defaults?.type ?? "LOCAL"}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOCAL">Local</SelectItem>
                  <SelectItem value="ATTRACTION">Atracción</SelectItem>
                </SelectContent>
              </Select>
              <FieldError message={errors.type} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {defaults?.avatarUrl && (
            <div className="flex items-center gap-3">
              <Image
                src={defaults.avatarUrl}
                alt="Avatar actual del spot"
                width={64}
                height={64}
                className="size-16 rounded-lg border object-cover"
              />
              <p className="text-muted-foreground text-xs">
                Avatar actual. Subí un archivo solo si querés reemplazarlo.
              </p>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="avatar">
              {isEdit ? "Nuevo avatar (opcional)" : "Imagen del spot"}
            </Label>
            <Input
              id="avatar"
              name="avatar"
              type="file"
              accept={AVATAR_ACCEPT}
              required={!isEdit}
            />
            <p className="text-muted-foreground text-xs">
              PNG, JPG o WebP, hasta 2MB. Es la medalla que ven los
              participantes al escanear el QR.
            </p>
            <FieldError message={errors.avatar} />
          </div>
        </CardContent>
      </Card>

      <FieldError message={errors._form} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

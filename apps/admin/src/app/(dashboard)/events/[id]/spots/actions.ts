"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/libs/supabase/service";
import { requireMembership } from "@/server/guard";
import {
  avatarExtension,
  parseSpotForm,
  type SpotFormErrors,
  validateAvatar,
} from "@/server/spot-form";

export type SpotFormState = { errors: SpotFormErrors } | null;

/** Verifica membresía y que el evento sea de la organización (ver events/actions). */
async function requireOrganizationEvent(eventId: string) {
  const { membership } = await requireMembership();
  const service = createServiceClient();
  const { data: event } = await service
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("organization_id", membership.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!event) redirect("/events");
  return { service, event };
}

async function uploadAvatar(
  service: ReturnType<typeof createServiceClient>,
  eventId: string,
  file: File,
): Promise<string | null> {
  const extension = avatarExtension(file.type);
  if (!extension) return null;

  // Misma convención que los spots existentes: <event_id>/<archivo>.
  const path = `${eventId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await service.storage
    .from("spot")
    .upload(path, file, { contentType: file.type });

  return error ? null : path;
}

const avatarFile = (formData: FormData) => {
  const file = formData.get("avatar");
  return file instanceof File ? file : null;
};

export async function createSpot(
  eventId: string,
  _prev: SpotFormState,
  formData: FormData,
): Promise<SpotFormState> {
  const { service } = await requireOrganizationEvent(eventId);

  const { values, errors } = parseSpotForm(formData);
  const avatar = validateAvatar(avatarFile(formData), true);
  if (avatar.error) errors.avatar = avatar.error;
  if (!values || !avatar.file) return { errors };

  const avatarPath = await uploadAvatar(service, eventId, avatar.file);
  if (!avatarPath) {
    return { errors: { avatar: "No se pudo subir la imagen." } };
  }

  const { error } = await service.from("event_spots").insert({
    event_id: eventId,
    name: values.name,
    description: values.description,
    location: values.location,
    type: values.type,
    avatar_path: avatarPath,
  });

  if (error) return { errors: { _form: "No se pudo crear el spot." } };

  revalidatePath(`/events/${eventId}/spots`);
  redirect(`/events/${eventId}/spots`);
}

export async function updateSpot(
  eventId: string,
  spotId: string,
  _prev: SpotFormState,
  formData: FormData,
): Promise<SpotFormState> {
  const { service } = await requireOrganizationEvent(eventId);

  const { data: spot } = await service
    .from("event_spots")
    .select("id, avatar_path")
    .eq("id", spotId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (!spot) redirect(`/events/${eventId}/spots`);

  const { values, errors } = parseSpotForm(formData);
  const avatar = validateAvatar(avatarFile(formData), false);
  if (avatar.error) errors.avatar = avatar.error;
  if (!values || avatar.error) return { errors };

  let avatarPath = spot.avatar_path;
  if (avatar.file) {
    const uploaded = await uploadAvatar(service, eventId, avatar.file);
    if (!uploaded) return { errors: { avatar: "No se pudo subir la imagen." } };
    avatarPath = uploaded;
  }

  const { error } = await service
    .from("event_spots")
    .update({
      name: values.name,
      description: values.description,
      location: values.location,
      type: values.type,
      avatar_path: avatarPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", spotId);

  if (error) return { errors: { _form: "No se pudo guardar el spot." } };

  // Limpieza best-effort del avatar anterior (ya no lo referencia nadie).
  if (avatar.file && avatarPath !== spot.avatar_path) {
    await service.storage.from("spot").remove([spot.avatar_path]);
  }

  revalidatePath(`/events/${eventId}/spots`);
  revalidatePath(`/events/${eventId}/spots/${spotId}`);
  return null;
}

/**
 * Borra un spot solo si no tiene escaneos: el historial referencia al spot y
 * es la base del sorteo, así que un spot escaneado no se elimina (se puede
 * editar o dejar de imprimir su QR).
 */
export async function deleteSpot(eventId: string, spotId: string) {
  const { service } = await requireOrganizationEvent(eventId);

  const { count } = await service
    .from("user_spot_history")
    .select("id", { count: "exact", head: true })
    .eq("spot_id", spotId);

  if (count && count > 0) {
    redirect(`/events/${eventId}/spots/${spotId}?deleteError=1`);
  }

  const { data: spot } = await service
    .from("event_spots")
    .delete()
    .eq("id", spotId)
    .eq("event_id", eventId)
    .select("avatar_path")
    .maybeSingle();

  if (spot?.avatar_path) {
    await service.storage.from("spot").remove([spot.avatar_path]);
  }

  revalidatePath(`/events/${eventId}/spots`);
  redirect(`/events/${eventId}/spots`);
}

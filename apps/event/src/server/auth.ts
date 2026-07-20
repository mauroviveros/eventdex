import type { User } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/server";
import { createServiceClient } from "@/libs/supabase/service";

/** Usuario autenticado en la request actual, o null si no hay sesión. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Única fuente de verdad para saber si un usuario es organizador (miembro de la
 * organización). Antes esta comprobación estaba duplicada e inconsistente en
 * el header, el perfil y el sorteo.
 */
export async function isOrganizer(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * IDs de todos los organizadores. Usa la service key porque necesita ver la
 * membresía de otros usuarios (RLS solo expone la propia); se usa para excluir a
 * los organizadores del sorteo.
 */
export async function getOrganizerUserIds(): Promise<string[]> {
  const service = createServiceClient();
  const { data } = await service.from("organization_members").select("user_id");
  return (data ?? [])
    .map((member) => member.user_id)
    .filter((id): id is string => Boolean(id));
}

/**
 * Parseo y validación del formulario de spots. Funciones puras (sin I/O);
 * las Server Actions las consumen. El avatar se valida acá (tipo/tamaño) pero
 * el upload ocurre en la action.
 */

export type SpotFormValues = {
  name: string;
  description: string;
  location: string;
  type: "LOCAL" | "ATTRACTION";
};

export type SpotFormErrors = Record<string, string>;

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

export function parseSpotForm(formData: FormData): {
  values: SpotFormValues | null;
  errors: SpotFormErrors;
} {
  const errors: SpotFormErrors = {};

  const name = text(formData, "name");
  const description = text(formData, "description");
  const type = text(formData, "type");

  if (!name) errors.name = "El nombre es obligatorio.";
  if (!description) errors.description = "La descripción es obligatoria.";
  if (type !== "LOCAL" && type !== "ATTRACTION") {
    errors.type = "Elegí un tipo de spot.";
  }

  if (Object.keys(errors).length > 0) return { values: null, errors };

  return {
    values: {
      name,
      description,
      location: text(formData, "location"),
      type: type as SpotFormValues["type"],
    },
    errors,
  };
}

/** Tipos de imagen aceptados para el avatar y su extensión en el bucket. */
const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const AVATAR_ACCEPT = Object.keys(AVATAR_EXTENSIONS).join(",");

/** Extensión para el mime type del avatar, o null si no es un tipo aceptado. */
export function avatarExtension(mimeType: string): string | null {
  return AVATAR_EXTENSIONS[mimeType] ?? null;
}

/**
 * Valida el archivo de avatar. `required` distingue alta (obligatorio) de
 * edición (conservar el actual si no se sube uno nuevo → null).
 */
export function validateAvatar(
  file: File | null,
  required: boolean,
): { file: File | null; error: string | null } {
  const empty = !file || file.size === 0;

  if (empty) {
    return required
      ? { file: null, error: "Subí una imagen para el spot." }
      : { file: null, error: null };
  }
  if (!avatarExtension(file.type)) {
    return { file: null, error: "Formato no soportado (PNG, JPG o WebP)." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { file: null, error: "La imagen no puede superar los 2MB." };
  }
  return { file, error: null };
}

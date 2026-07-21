/**
 * Parseo y validación del formulario de eventos. Funciones puras (sin I/O)
 * para poder testearlas; las Server Actions las consumen.
 */

export type EventFormValues = {
  title: string;
  description: string;
  edition: string | null;
  timezone: string;
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
};

export type EventFormErrors = Record<string, string>;

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

const REQUIRED: Array<{ field: string; label: string }> = [
  { field: "title", label: "El título es obligatorio." },
  { field: "description", label: "La descripción es obligatoria." },
  { field: "location_name", label: "El nombre del lugar es obligatorio." },
  { field: "location_address", label: "La dirección es obligatoria." },
  { field: "location_city", label: "La ciudad es obligatoria." },
  { field: "location_state", label: "La provincia es obligatoria." },
  { field: "location_country", label: "El país es obligatorio." },
];

export function parseEventForm(formData: FormData): {
  values: EventFormValues | null;
  errors: EventFormErrors;
} {
  const errors: EventFormErrors = {};

  for (const { field, label } of REQUIRED) {
    if (!text(formData, field)) errors[field] = label;
  }

  const timezone = text(formData, "timezone");
  if (!timezone) {
    errors.timezone = "El timezone es obligatorio.";
  } else if (!isValidTimeZone(timezone)) {
    errors.timezone = "Timezone inválido (usá un identificador IANA).";
  }

  if (Object.keys(errors).length > 0) return { values: null, errors };

  return {
    values: {
      title: text(formData, "title"),
      description: text(formData, "description"),
      edition: text(formData, "edition") || null,
      timezone,
      location: {
        name: text(formData, "location_name"),
        address: text(formData, "location_address"),
        city: text(formData, "location_city"),
        state: text(formData, "location_state"),
        country: text(formData, "location_country"),
      },
    },
    errors,
  };
}

/**
 * Parsea el par inicio/fin de un horario. Los valores vienen de inputs
 * `datetime-local` (sin zona); la conversión a UTC con el timezone del evento
 * ocurre después, en la action (ver `localToUtcIso`).
 */
export function parseScheduleForm(formData: FormData): {
  values: { start: string; end: string } | null;
  error: string | null;
} {
  const start = text(formData, "start_datetime");
  const end = text(formData, "end_datetime");

  if (!start || !end) {
    return { values: null, error: "Completá inicio y fin del horario." };
  }
  if (end <= start) {
    return { values: null, error: "El fin debe ser posterior al inicio." };
  }
  return { values: { start, end }, error: null };
}

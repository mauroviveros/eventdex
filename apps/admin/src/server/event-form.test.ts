import { describe, expect, it } from "vitest";
import {
  isValidTimeZone,
  parseEventForm,
  parseScheduleForm,
  parseSiteUrl,
} from "./event-form";

const validForm = () => {
  const form = new FormData();
  form.set("title", "Burning Tower Fest");
  form.set("description", "El evento TCG más grande");
  form.set("edition", "2027");
  form.set("timezone", "America/Argentina/Buenos_Aires");
  form.set("location_name", "Lo de Charly");
  form.set("location_address", "Av. Siempreviva 742");
  form.set("location_city", "Springfield");
  form.set("location_state", "Buenos Aires");
  form.set("location_country", "Argentina");
  return form;
};

describe("parseEventForm", () => {
  it("acepta un formulario completo", () => {
    const { values, errors } = parseEventForm(validForm());
    expect(errors).toEqual({});
    expect(values?.title).toBe("Burning Tower Fest");
    expect(values?.location.city).toBe("Springfield");
  });

  it("normaliza edition vacío a null y recorta espacios", () => {
    const form = validForm();
    form.set("edition", "  ");
    form.set("title", "  Con espacios  ");
    const { values } = parseEventForm(form);
    expect(values?.edition).toBeNull();
    expect(values?.title).toBe("Con espacios");
  });

  it("marca los campos obligatorios faltantes", () => {
    const form = validForm();
    form.set("title", "");
    form.delete("location_city");
    const { values, errors } = parseEventForm(form);
    expect(values).toBeNull();
    expect(errors.title).toBeDefined();
    expect(errors.location_city).toBeDefined();
  });

  it("rechaza timezones inválidos", () => {
    const form = validForm();
    form.set("timezone", "America/Springfield");
    const { errors } = parseEventForm(form);
    expect(errors.timezone).toBeDefined();
  });
});

describe("parseSiteUrl", () => {
  it("vacío es válido y queda null", () => {
    expect(parseSiteUrl("")).toEqual({ url: null, error: null });
  });

  it("normaliza quitando la barra final", () => {
    expect(parseSiteUrl("https://evento.com/").url).toBe("https://evento.com");
  });

  it("rechaza valores que no son URLs http(s)", () => {
    expect(parseSiteUrl("evento.com").error).toBeTruthy();
    expect(parseSiteUrl("ftp://evento.com").error).toBeTruthy();
  });
});

describe("isValidTimeZone", () => {
  it("acepta identificadores IANA y rechaza inventados", () => {
    expect(isValidTimeZone("America/Argentina/Buenos_Aires")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });
});

describe("parseScheduleForm", () => {
  const form = (start: string, end: string) => {
    const data = new FormData();
    data.set("start_datetime", start);
    data.set("end_datetime", end);
    return data;
  };

  it("acepta un rango válido", () => {
    const { values, error } = parseScheduleForm(
      form("2027-09-12T10:00", "2027-09-12T20:00"),
    );
    expect(error).toBeNull();
    expect(values).toEqual({
      start: "2027-09-12T10:00",
      end: "2027-09-12T20:00",
    });
  });

  it("rechaza fin anterior o igual al inicio", () => {
    expect(
      parseScheduleForm(form("2027-09-12T20:00", "2027-09-12T10:00")).error,
    ).toBeTruthy();
    expect(
      parseScheduleForm(form("2027-09-12T10:00", "2027-09-12T10:00")).error,
    ).toBeTruthy();
  });

  it("rechaza campos vacíos", () => {
    expect(parseScheduleForm(form("", "2027-09-12T10:00")).error).toBeTruthy();
  });
});

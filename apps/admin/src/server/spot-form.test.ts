import { describe, expect, it } from "vitest";
import { avatarExtension, parseSpotForm, validateAvatar } from "./spot-form";

const validForm = () => {
  const form = new FormData();
  form.set("name", "Lo de Charly");
  form.set("description", "Local de cartas");
  form.set("location", "Stand 4");
  form.set("type", "LOCAL");
  return form;
};

describe("parseSpotForm", () => {
  it("acepta un formulario completo", () => {
    const { values, errors } = parseSpotForm(validForm());
    expect(errors).toEqual({});
    expect(values).toEqual({
      name: "Lo de Charly",
      description: "Local de cartas",
      location: "Stand 4",
      type: "LOCAL",
    });
  });

  it("permite location vacía", () => {
    const form = validForm();
    form.delete("location");
    const { values } = parseSpotForm(form);
    expect(values?.location).toBe("");
  });

  it("marca faltantes y tipo inválido", () => {
    const form = validForm();
    form.set("name", "  ");
    form.set("type", "OTRO");
    const { values, errors } = parseSpotForm(form);
    expect(values).toBeNull();
    expect(errors.name).toBeDefined();
    expect(errors.type).toBeDefined();
  });
});

describe("avatarExtension", () => {
  it("mapea mime types aceptados y rechaza el resto", () => {
    expect(avatarExtension("image/png")).toBe("png");
    expect(avatarExtension("image/jpeg")).toBe("jpg");
    expect(avatarExtension("image/webp")).toBe("webp");
    expect(avatarExtension("image/gif")).toBeNull();
    expect(avatarExtension("application/pdf")).toBeNull();
  });
});

describe("validateAvatar", () => {
  const image = (type: string, bytes: number) =>
    new File([new Uint8Array(bytes)], "avatar", { type });

  it("exige archivo cuando es obligatorio", () => {
    expect(validateAvatar(null, true).error).toBeTruthy();
    expect(validateAvatar(image("image/png", 0), true).error).toBeTruthy();
  });

  it("permite omitirlo cuando no es obligatorio", () => {
    const { file, error } = validateAvatar(null, false);
    expect(file).toBeNull();
    expect(error).toBeNull();
  });

  it("rechaza formatos no soportados y archivos grandes", () => {
    expect(validateAvatar(image("image/gif", 100), true).error).toBeTruthy();
    expect(
      validateAvatar(image("image/png", 3 * 1024 * 1024), true).error,
    ).toBeTruthy();
  });

  it("acepta una imagen válida", () => {
    const file = image("image/webp", 1024);
    expect(validateAvatar(file, true)).toEqual({ file, error: null });
  });
});

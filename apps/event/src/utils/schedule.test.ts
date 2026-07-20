import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
  formatScheduleLabel,
  isScheduleActive,
  resolveScheduleDateTime,
} from "./schedule";

describe("resolveScheduleDateTime", () => {
  it("interpreta como UTC los valores sin zona horaria", () => {
    // La DB guarda timestamps sin offset; deben tratarse como UTC, no como hora local.
    const dt = resolveScheduleDateTime("2025-04-06T20:00:00");
    expect(dt.toUTC().hour).toBe(20);
  });

  it("respeta la zona horaria cuando el valor la incluye", () => {
    expect(resolveScheduleDateTime("2025-04-06T20:00:00Z").toUTC().hour).toBe(
      20,
    );
    expect(
      resolveScheduleDateTime("2025-04-06T20:00:00-03:00").toUTC().hour,
    ).toBe(23);
  });
});

describe("isScheduleActive", () => {
  const schedule = {
    start_datetime: "2025-04-06T20:00:00",
    end_datetime: "2025-04-06T23:00:00",
  };

  // Date.UTC siempre produce un instante válido; el cast descarta el tipo unión
  // válido/inválido que luxon asigna por defecto a sus constructores.
  const utc = (...args: Parameters<typeof Date.UTC>) =>
    DateTime.fromMillis(Date.UTC(...args)) as DateTime<true>;

  it("es true dentro del rango", () => {
    expect(isScheduleActive(schedule, utc(2025, 3, 6, 21))).toBe(true);
  });

  it("es false antes del inicio y después del fin", () => {
    expect(isScheduleActive(schedule, utc(2025, 3, 6, 19, 59, 59))).toBe(false);
    expect(isScheduleActive(schedule, utc(2025, 3, 6, 23, 0, 1))).toBe(false);
  });

  it("incluye los bordes (inicio y fin exactos)", () => {
    expect(isScheduleActive(schedule, utc(2025, 3, 6, 20))).toBe(true);
    expect(isScheduleActive(schedule, utc(2025, 3, 6, 23))).toBe(true);
  });
});

describe("formatScheduleLabel", () => {
  const schedule = {
    start_datetime: "2025-04-06T20:00:00",
    end_datetime: "2025-04-07T01:00:00",
  };

  it("formatea día, rango horario y zona en la zona del evento", () => {
    expect(formatScheduleLabel(schedule, "UTC")).toBe(
      "Domingo 6 de abril · 20:00hs a 01:00hs (UTC)",
    );
  });

  it("desplaza las horas y refleja la zona horaria recibida", () => {
    // 20:00 UTC → 17:00 en Argentina (UTC-3).
    const label = formatScheduleLabel(
      schedule,
      "America/Argentina/Buenos_Aires",
    );
    expect(label).toContain("17:00hs");
    expect(label).toContain("GMT-3");
  });
});

import { describe, expect, it } from "vitest";
import { activityDays, scansPerHour, scheduleHourBounds } from "./analytics";

const tz = "America/Argentina/Buenos_Aires";

// Evento tipo: domingo 5 de abril, 13:00–18:00 hora argentina (16–21 UTC).
const schedules = [
  {
    start_datetime: "2026-04-05T16:00:00+00:00",
    end_datetime: "2026-04-05T21:00:00+00:00",
  },
];

describe("activityDays", () => {
  it("une días con horario y días con escaneos, ordenados", () => {
    const scans = [
      // 23:50 UTC del 4 son las 20:50 del 4 en Buenos Aires (prueba previa).
      { collected_at: "2026-04-04T23:50:00+00:00" },
      { collected_at: "2026-04-05T17:00:00+00:00" },
    ];
    expect(activityDays(scans, schedules, tz)).toEqual([
      "2026-04-04",
      "2026-04-05",
    ]);
  });

  it("expande horarios que cruzan más de un día", () => {
    const multiDay = [
      {
        start_datetime: "2026-04-05T16:00:00+00:00",
        end_datetime: "2026-04-07T21:00:00+00:00",
      },
    ];
    expect(activityDays([], multiDay, tz)).toEqual([
      "2026-04-05",
      "2026-04-06",
      "2026-04-07",
    ]);
  });

  it("sin escaneos ni horarios devuelve vacío", () => {
    expect(activityDays([], [], tz)).toEqual([]);
  });
});

describe("scansPerHour", () => {
  const scans = [
    { collected_at: "2026-04-05T16:10:00+00:00" }, // 13:10 BA
    { collected_at: "2026-04-05T16:40:00+00:00" }, // 13:40 BA
    { collected_at: "2026-04-05T19:05:00+00:00" }, // 16:05 BA
    { collected_at: "2026-04-04T23:50:00+00:00" }, // otro día
  ];

  it("agrupa por hora local del día pedido y rellena huecos", () => {
    expect(scansPerHour(scans, tz, "2026-04-05")).toEqual([
      { hour: 13, label: "13:00", count: 2 },
      { hour: 14, label: "14:00", count: 0 },
      { hour: 15, label: "15:00", count: 0 },
      { hour: 16, label: "16:00", count: 1 },
    ]);
  });

  it("amplía el rango con los bounds del horario programado", () => {
    const perHour = scansPerHour(scans, tz, "2026-04-05", { from: 13, to: 18 });
    expect(perHour[0]).toEqual({ hour: 13, label: "13:00", count: 2 });
    expect(perHour[perHour.length - 1]).toEqual({
      hour: 18,
      label: "18:00",
      count: 0,
    });
    expect(perHour).toHaveLength(6);
  });

  it("día sin escaneos ni bounds devuelve vacío", () => {
    expect(scansPerHour(scans, tz, "2026-04-06")).toEqual([]);
  });
});

describe("scheduleHourBounds", () => {
  it("devuelve el rango horario local del día", () => {
    expect(scheduleHourBounds(schedules, tz, "2026-04-05")).toEqual({
      from: 13,
      to: 18,
    });
  });

  it("null si ningún horario toca el día", () => {
    expect(scheduleHourBounds(schedules, tz, "2026-04-06")).toBeNull();
  });

  it("recorta a 0–23 cuando el horario cruza medianoche", () => {
    const overnight = [
      {
        // 22:00 del 5 a 02:00 del 6 hora argentina.
        start_datetime: "2026-04-06T01:00:00+00:00",
        end_datetime: "2026-04-06T05:00:00+00:00",
      },
    ];
    expect(scheduleHourBounds(overnight, tz, "2026-04-05")).toEqual({
      from: 22,
      to: 23,
    });
    expect(scheduleHourBounds(overnight, tz, "2026-04-06")).toEqual({
      from: 0,
      to: 2,
    });
  });
});

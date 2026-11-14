import { describe, expect, it } from "vitest";
import { MANY_SPOTS, onlyFirstMedal, prizeLadder } from "./prizes";

const bike = { id: "1", title: "Bicicleta", minClaims: 1 };
const tablet = { id: "2", title: "Tablet", minClaims: 3 };
const trip = { id: "3", title: "Viaje", minClaims: 5 };

describe("prizeLadder", () => {
  it("shows nothing without raffles", () => {
    expect(prizeLadder([], 0, 10)).toEqual({
      prizes: [],
      next: null,
      reached: null,
      unreachable: [],
    });
  });

  it("says the first medal is enough when the minimum is 1", () => {
    expect(prizeLadder([bike], 0, 4).next?.phrase).toBe(
      "Con tu primera medalla ya entrás al sorteo de Bicicleta",
    );
  });

  it("asks to gather N medals when the minimum is 2 or more and there are none", () => {
    expect(prizeLadder([tablet], 0, 4).next?.phrase).toBe(
      "Juntá 3 medallas y entrás al sorteo de Tablet",
    );
  });

  it("counts what is missing once there are some medals", () => {
    const { next } = prizeLadder([tablet], 1, 4);
    expect(next?.phrase).toBe("Te faltan 2 para el sorteo de Tablet");
    expect(next?.missing).toBe(2);
  });

  it("says it in the singular when one medal is missing", () => {
    expect(prizeLadder([tablet], 2, 4).next?.phrase).toBe(
      "Te falta 1 para el sorteo de Tablet",
    );
  });

  it("says the visitor is in once the minimum is reached", () => {
    const ladder = prizeLadder([bike], 1, 4);
    expect(ladder.reached?.phrase).toBe("Ya estás en el sorteo de Bicicleta");
    expect(ladder.next).toBeNull();
    expect(ladder.prizes[0]?.missing).toBe(0);
  });

  it("orders the ladder from lowest to highest and marks the closest one", () => {
    const ladder = prizeLadder([trip, bike, tablet], 1, 6);
    expect(ladder.prizes.map((p) => [p.title, p.status])).toEqual([
      ["Bicicleta", "reached"],
      ["Tablet", "next"],
      ["Viaje", "later"],
    ]);
    expect(ladder.reached?.title).toBe("Bicicleta");
    expect(ladder.next?.title).toBe("Tablet");
  });

  it("keeps the highest reached prize and the next one when there is a higher one", () => {
    const ladder = prizeLadder([bike, tablet, trip], 3, 6);
    expect(ladder.reached?.title).toBe("Tablet");
    expect(ladder.next?.title).toBe("Viaje");
    expect(ladder.next?.phrase).toBe("Te faltan 2 para el sorteo de Viaje");
  });

  it("breaks a tie in the minimum by title, so the order never jumps", () => {
    const a = { id: "a", title: "Auriculares", minClaims: 2 };
    const b = { id: "b", title: "Bici", minClaims: 2 };
    expect(prizeLadder([b, a], 0, 4).prizes.map((p) => p.title)).toEqual([
      "Auriculares",
      "Bici",
    ]);
  });

  it("hides a prize that asks for more medals than the event has and reports it", () => {
    const ladder = prizeLadder([bike, trip], 0, 4);
    expect(ladder.prizes.map((p) => p.title)).toEqual(["Bicicleta"]);
    expect(ladder.unreachable).toEqual([trip]);
  });

  it("keeps a prize that asks for exactly every stand", () => {
    expect(prizeLadder([tablet], 0, 3).prizes).toHaveLength(1);
  });

  it("does not mutate the raffles it receives", () => {
    const list = [trip, bike];
    prizeLadder(list, 0, 6);
    expect(list).toEqual([trip, bike]);
  });
});

describe("onlyFirstMedal", () => {
  it("warns when the only prize asks for one medal and there are many stands", () => {
    expect(onlyFirstMedal([bike], MANY_SPOTS + 1)).toBe(true);
  });

  it("does not warn with few stands, where one medal is most of the collection", () => {
    expect(onlyFirstMedal([bike], MANY_SPOTS)).toBe(false);
  });

  it("does not warn when some prize asks for more", () => {
    expect(onlyFirstMedal([bike, tablet], 45)).toBe(false);
  });

  it("does not warn without raffles", () => {
    expect(onlyFirstMedal([], 45)).toBe(false);
  });

  it("ignores prizes nobody can reach", () => {
    expect(onlyFirstMedal([bike, { ...trip, minClaims: 99 }], 45)).toBe(true);
  });
});

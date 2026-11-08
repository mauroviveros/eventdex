import { describe, expect, it } from "vitest";
import { collectionProgress } from "./claims";

const spots = [
  { id: "a", points: 1 },
  { id: "b", points: 3 },
  { id: "c", points: 5 },
];

describe("collectionProgress", () => {
  it("starts empty", () => {
    expect(collectionProgress(spots, [])).toEqual({
      medals: 0,
      total: 3,
      points: 0,
      maxPoints: 9,
    });
  });

  it("adds the points of each claimed spot", () => {
    expect(collectionProgress(spots, ["a", "c"])).toEqual({
      medals: 2,
      total: 3,
      points: 6,
      maxPoints: 9,
    });
  });

  it("ignores medals of spots no longer in the collection", () => {
    expect(collectionProgress(spots, ["b", "apagado"])).toMatchObject({
      medals: 1,
      points: 3,
    });
  });

  it("an event without spots has nothing to collect", () => {
    expect(collectionProgress([], [])).toEqual({
      medals: 0,
      total: 0,
      points: 0,
      maxPoints: 0,
    });
  });
});

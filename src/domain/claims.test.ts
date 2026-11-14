import { describe, expect, it } from "vitest";
import { collectionProgress, missingSpots } from "./claims";

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

describe("missingSpots", () => {
  const spots = ["a", "b", "c", "d", "e"].map((id) => ({ id }));

  it("names the first stands still missing, in order, and counts the rest", () => {
    expect(missingSpots(spots, ["b"])).toEqual({
      shown: [{ id: "a" }, { id: "c" }, { id: "d" }],
      more: 1,
    });
  });

  it("names them all when there are few", () => {
    expect(missingSpots(spots, ["a", "b", "c"])).toEqual({
      shown: [{ id: "d" }, { id: "e" }],
      more: 0,
    });
  });

  it("has nothing to say once the collection is complete", () => {
    expect(missingSpots(spots, ["a", "b", "c", "d", "e"])).toEqual({
      shown: [],
      more: 0,
    });
  });

  it("ignores medals of stands that are not in the list", () => {
    expect(missingSpots(spots, ["zz"]).more).toBe(2);
  });
});

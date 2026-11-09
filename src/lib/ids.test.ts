import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";

// Spots, venues, schedules, registrations and claims imported from the v1 have
// ids from md5(...)::uuid: Postgres takes them, but they are not RFC 4122.
const IMPORTED = "f2c5b67a-625b-cd1b-9686-88b1382531ff";
const STRICT = `z.${"uuid"}(`;

describe("ids", () => {
  it("accepts the ids imported from the v1", () => {
    expect(z.guid().safeParse(IMPORTED).success).toBe(true);
  });

  it("never validates a database id with the strict RFC check", () => {
    const offenders = readdirSync("src", { recursive: true, encoding: "utf8" })
      .filter((file) => /\.tsx?$/.test(file))
      .filter((file) =>
        readFileSync(join("src", file), "utf8").includes(STRICT),
      );
    expect(offenders).toEqual([]);
  });
});

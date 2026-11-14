import { afterEach, describe, expect, it, vi } from "vitest";
import { requireVisitor } from "./viewer";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-public-path": "/mis-medallas" }),
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));
// Loads env on import; nothing here reads it.
vi.mock("./organizations", () => ({}));
// No session: getClaims answers without a user.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: null }) },
  }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requireVisitor without a session", () => {
  it("goes straight to Google in production, coming back to the page", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(requireVisitor()).rejects.toThrow(
      "redirect /auth/google?next=%2Fmis-medallas",
    );
  });

  it("goes through /ingresar elsewhere, where the mail link lives", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await expect(requireVisitor()).rejects.toThrow(
      "redirect /ingresar?next=%2Fmis-medallas",
    );
  });
});

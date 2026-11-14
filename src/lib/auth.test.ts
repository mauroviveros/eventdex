import { describe, expect, it, vi } from "vitest";
import { googleSignInUrl, signInErrorUrl } from "./auth";

const ORIGIN = "https://expo.example.com";

const clientReturning = (result: {
  data: { url: string | null };
  error: unknown;
}) => {
  const signInWithOAuth = vi.fn(async () => result);
  return { client: { auth: { signInWithOAuth } } as never, signInWithOAuth };
};

describe("googleSignInUrl", () => {
  it("goes to Google, asking it to come back to the callback with next", async () => {
    const { client, signInWithOAuth } = clientReturning({
      data: { url: "https://accounts.google.com/o/oauth2/auth?x=1" },
      error: null,
    });

    const url = await googleSignInUrl(client, ORIGIN, "/s/abc");

    expect(url).toBe("https://accounts.google.com/o/oauth2/auth?x=1");
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${ORIGIN}/auth/callback?next=${encodeURIComponent("/s/abc")}`,
      },
    });
  });

  it("lands on the sign-in error when the provider fails", async () => {
    const { client } = clientReturning({
      data: { url: null },
      error: new Error("down"),
    });

    expect(await googleSignInUrl(client, ORIGIN, "/s/abc")).toBe(
      "/s/abc?error=auth",
    );
  });
});

describe("signInErrorUrl", () => {
  it("sends a failed sign-in from a QR back to that QR, with the error", () => {
    expect(signInErrorUrl("/s/abc")).toBe("/s/abc?error=auth");
  });

  it("sends any other failed sign-in to /ingresar, keeping where it was going", () => {
    expect(signInErrorUrl("/mis-medallas?evento=feria")).toBe(
      `/ingresar?error=auth&next=${encodeURIComponent("/mis-medallas?evento=feria")}`,
    );
  });
});

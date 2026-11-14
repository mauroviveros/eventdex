import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignInLink } from "./VisitorMenu";

const pathname = vi.hoisted(() => ({ value: "/eventos/feria" }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
  useSearchParams: () => new URLSearchParams("a=1"),
}));
vi.mock("@/lib/actions/auth", () => ({ signInWithGoogle: vi.fn() }));

afterEach(() => {
  vi.unstubAllEnvs();
  pathname.value = "/eventos/feria";
});

const render = () => renderToStaticMarkup(createElement(SignInLink));

describe("SignInLink", () => {
  it("goes straight to Google in production, coming back to this page", () => {
    vi.stubEnv("NODE_ENV", "production");
    const html = render();
    expect(html).toContain('name="next"');
    expect(html).toContain('value="/eventos/feria?a=1"');
    expect(html).not.toContain("/ingresar");
  });

  it("goes through /ingresar elsewhere, where the mail link lives", () => {
    vi.stubEnv("NODE_ENV", "development");
    const html = render();
    expect(html).toContain('href="/ingresar?next=%2Feventos%2Fferia%3Fa%3D1"');
    expect(html).not.toContain('name="next"');
  });

  it.each(["/ingresar", "/s/abc"])(
    "hides on %s, which is already the sign-in",
    (path) => {
      pathname.value = path;
      expect(render()).toBe("");
    },
  );
});

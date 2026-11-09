import { expect, test } from "@playwright/test";

const ORIGIN = "http://localhost:3000";

test("the landing's console plays the visitor's loop", async ({ page }) => {
  await page.goto(ORIGIN);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const status = page.locator("p[aria-live]");
  const button = (name: string) => page.getByRole("button", { name });

  await expect(status).toContainText("¡Medalla nueva!");
  await expect(page.getByText("3 de 5 medallas")).toBeVisible();

  await button("Bajar al stand siguiente").click();
  await expect(status).toContainText("Todavía no la tenés");
  await expect(status).toContainText("Taller de cerámica");

  await button("Escanear el QR de este stand").click();
  await expect(status).toContainText("¡Medalla nueva!");
  await expect(page.getByText("4 de 5 medallas")).toBeVisible();

  await button("Escanear el QR de este stand").click();
  await expect(status).toContainText("Esta ya la tenías");
  await expect(page.getByText("4 de 5 medallas")).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Escribinos" }).first(),
  ).toHaveAttribute("href", /^mailto:/);
});

test("the landing tells crawlers what to index", async ({ request }) => {
  const robots = await request.get(`${ORIGIN}/robots.txt`);
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(
    "Sitemap: http://localhost:3000/sitemap.xml",
  );

  const sitemap = await request.get(`${ORIGIN}/sitemap.xml`);
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("/privacidad</loc>");
});

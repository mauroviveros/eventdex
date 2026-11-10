import { expect, test } from "@playwright/test";
import { signInByMail } from "./support/mailpit";
import { seedLiveEvent } from "./support/seed";

let seed: Awaited<ReturnType<typeof seedLiveEvent>>;

test.beforeAll(async () => {
  seed = await seedLiveEvent();
});

test.afterAll(async () => {
  await seed?.cleanup();
});

const admin = () => `http://app.localhost:3000/${seed.org.slug}`;
const TOGGLE = "Mostrar u ocultar el menú";

test("on a phone the menu is a sheet that closes after choosing a section", async ({
  page,
}) => {
  await page.goto(admin());
  await signInByMail(page, seed.ownerEmail);
  const sections = page.getByRole("navigation", { name: "Secciones" });
  await expect(sections).toBeHidden();

  await page.getByRole("button", { name: TOGGLE }).click();
  await sections.getByRole("link", { name: "Sedes" }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Sedes" }),
  ).toBeVisible();
  await expect(sections).toBeHidden();
});

test.describe("on a desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });

  test("the sidebar collapses to icons, remembers it, and the account signs out", async ({
    page,
  }) => {
    await page.goto(admin());
    await signInByMail(page, seed.ownerEmail);
    const sections = page.getByRole("navigation", { name: "Secciones" });
    const eventos = sections.getByRole("link", { name: "Eventos" });
    await expect(eventos).toHaveAttribute("aria-current", "page");

    await test.step("collapsed survives a reload, and the link keeps its name", async () => {
      const sidebar = page.locator("[data-slot=sidebar]");
      await page.getByRole("button", { name: TOGGLE }).click();
      await page.reload();
      await expect(sidebar).toHaveAttribute("data-state", "collapsed");
      await expect(eventos).toBeVisible();
      await page.getByRole("button", { name: TOGGLE }).click();
      await expect(sidebar).toHaveAttribute("data-state", "expanded");
    });

    await test.step("Salir from the account menu ends the session", async () => {
      await page.getByRole("button", { name: "Opciones de la cuenta" }).click();
      await page.getByRole("menuitem", { name: "Salir" }).click();
      await expect(page).toHaveURL(/\/ingresar/);
    });
  });
});

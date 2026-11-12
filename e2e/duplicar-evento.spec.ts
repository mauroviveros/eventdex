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

test("an event is duplicated into a draft with its spots", async ({ page }) => {
  const admin = `http://app.localhost:3000/${seed.org.slug}`;
  await page.goto(admin);
  await signInByMail(page, seed.ownerEmail);

  await test.step("the form starts from the original, from its card's menu", async () => {
    await page.getByRole("button", { name: "Acciones de Feria E2E" }).click();
    await page.getByRole("menuitem", { name: "Duplicar" }).click();
    await expect(
      page.getByRole("heading", { name: "Duplicar evento" }),
    ).toBeVisible();
    await expect(page.getByText("Se copian 2 spots")).toBeVisible();
    await expect(page.getByLabel("Nombre")).toHaveValue("Feria E2E");
  });

  await test.step("the copy is a draft without schedules, its address from name and edition", async () => {
    await expect(page.getByLabel("Dirección en el panel")).toHaveCount(0);
    await page.getByLabel("Edición").fill("Noviembre");
    await page.getByRole("button", { name: "Duplicar evento" }).click();
    await expect(page).toHaveURL(/\/eventos\/feria-e2e-noviembre$/);
    await expect(page.getByText("Todavía no hay jornadas")).toBeVisible();
    await expect(page.getByText("Es un borrador")).toBeVisible();
  });

  await test.step("and keeps the spots, each with its code", async () => {
    await page.goto(`${admin}/eventos/feria-e2e-noviembre?tab=spots`);
    await expect(page.getByText("A01", { exact: true })).toBeVisible();
    await expect(page.getByText("A02", { exact: true })).toBeVisible();
  });

  await test.step("renaming from Editar keeps the address", async () => {
    await page.getByRole("button", { name: "Editar Feria E2E" }).click();
    const sheet = page.getByRole("dialog", { name: "Editar Feria E2E" });
    await sheet.getByLabel("Nombre").fill("Feria de Noviembre");
    await sheet.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(
      page.getByRole("dialog", { name: "Editar Feria de Noviembre" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { level: 1, name: "Feria de Noviembre" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/eventos\/feria-e2e-noviembre\?tab=spots$/);
  });
});

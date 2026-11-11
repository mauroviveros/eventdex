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

test("an event created without a venue gets one later, and can drop it", async ({
  page,
}) => {
  const panel = `http://app.localhost:3000/${seed.org.slug}`;
  const sede = page.getByRole("combobox", { name: "Sede" });

  await page.goto(`${panel}/eventos/${seed.event.slug}`);
  await signInByMail(page, seed.ownerEmail);
  await expect(page.getByText("Todavía no cargaste sedes.")).toBeVisible();

  await page.getByRole("link", { name: "Cargá una" }).click();
  // The event page has a "Nombre" too (the schedule's): wait for the venues page.
  await expect(page.getByRole("heading", { name: "Nueva sede" })).toBeVisible();
  await page.getByLabel("Nombre").fill("Predio Ferial");
  await page.getByRole("button", { name: "Crear sede" }).click();
  await expect(page.getByText("Sede creada.")).toBeVisible();

  await page.goto(`${panel}/eventos/${seed.event.slug}`);
  await sede.selectOption({ label: "Predio Ferial" });
  await page.getByRole("button", { name: "Guardar sede" }).click();
  await expect(page.getByText("Sede guardada.")).toBeVisible();
  await page.reload();
  await expect(sede.locator("option:checked")).toHaveText("Predio Ferial");
  await expect(
    page.getByRole("definition").getByText("Predio Ferial"),
  ).toBeVisible();

  await sede.selectOption({ label: "Sin sede" });
  await page.getByRole("button", { name: "Guardar sede" }).click();
  await expect(page.getByText("Sede guardada.")).toBeVisible();
  await expect(
    page.getByRole("definition").getByText("Sin sede"),
  ).toBeVisible();
});

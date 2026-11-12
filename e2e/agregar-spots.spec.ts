import { expect, test } from "@playwright/test";
import { signInByMail } from "./support/mailpit";
import { seedLiveEvent } from "./support/seed";

let seed: Awaited<ReturnType<typeof seedLiveEvent>>;

test.beforeAll(async () => {
  seed = await seedLiveEvent();
  await seed.addDraft();
});

test.afterAll(async () => {
  await seed?.cleanup();
});

test("spots are added one after another without the sheet closing", async ({
  page,
}) => {
  const url = `http://localhost:3000/panel/${seed.org.slug}/eventos/feria-borrador?tab=spots`;
  await page.goto(url);
  await signInByMail(page, seed.ownerEmail);
  await page.goto(url);
  await expect(
    page.getByText("Todavía no hay spots en este evento"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Agregar spots" }).click();
  const sheet = page.getByRole("dialog", { name: "Agregar desde el catálogo" });

  for (const [name, code] of [
    ["Café de la Esquina", "A01"],
    ["Rueda gigante", "A02"],
  ] as const) {
    await test.step(`adds ${name} as ${code}, and the sheet stays open`, async () => {
      await sheet.getByRole("button", { name: "Spot del catálogo" }).click();
      await page.getByRole("option", { name }).click();
      await sheet.getByRole("button", { name: "Agregar al evento" }).click();
      await expect(page.getByText(code, { exact: true })).toBeVisible();
      await expect(sheet).toBeVisible();
    });
  }

  await expect(
    sheet.getByText("Todos los spots del catálogo ya están en el evento."),
  ).toBeVisible();
});

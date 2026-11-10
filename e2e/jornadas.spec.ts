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

/** Picks the 15th of the month the calendar opens on (the only 15 it shows). */
async function pickThe15th(
  page: import("@playwright/test").Page,
  field: string,
) {
  await page.getByRole("button", { name: new RegExp(`^${field}:`) }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: / 15 de / })
    .click();
}

test("a schedule is added with the calendar, and a wrong one keeps what was typed", async ({
  page,
}) => {
  await page.goto(
    `http://app.localhost:3000/${seed.org.slug}/eventos/${seed.event.slug}`,
  );
  await signInByMail(page, seed.ownerEmail);

  await test.step("an end before the start is rejected and the values stay", async () => {
    await pickThe15th(page, "Empieza");
    await page.getByLabel("Empieza: hora").fill("18:00");
    await pickThe15th(page, "Termina");
    await page.getByLabel("Termina: hora").fill("10:00");
    await page.getByRole("button", { name: "Agregar jornada" }).click();

    await expect(
      page.getByText("El fin tiene que ser después del inicio."),
    ).toBeVisible();
    await expect(page.getByLabel("Empieza: hora")).toHaveValue("18:00");
    await expect(
      page.getByRole("button", { name: /^Termina: .* 15 / }),
    ).toBeVisible();
  });

  await test.step("fixed, it is added and the form empties", async () => {
    await page.getByLabel("Empieza: hora").fill("10:00");
    await page.getByLabel("Termina: hora").fill("18:00");
    await page.getByRole("button", { name: "Agregar jornada" }).click();

    await expect(page.getByText("Jornada agregada.")).toBeVisible();
    await expect(page.getByText(/10:00.18:00/).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Empieza: Elegí la fecha" }),
    ).toBeVisible();
  });
});

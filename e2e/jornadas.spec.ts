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

type Page = import("@playwright/test").Page;
type Locator = import("@playwright/test").Locator;

/** Picks the 15th of the month the calendar opens on (the only 15 it shows). */
async function pickThe15th(page: Page, form: Locator, field: string) {
  await form.getByRole("button", { name: new RegExp(`^${field}:`) }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: / 15 de / })
    .click();
}

test("a schedule is added with the calendar, and a wrong one keeps what was typed", async ({
  page,
}) => {
  await page.goto(
    `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}`,
  );
  await signInByMail(page, seed.ownerEmail);
  // The schedules are edited in their own sheet, from the General tab.
  await page.getByRole("button", { name: "Editar jornadas" }).click();
  const add = page.getByRole("region", { name: "Nueva jornada" });

  await test.step("an end before the start is rejected and the values stay", async () => {
    await pickThe15th(page, add, "Empieza");
    await add.getByLabel("Empieza: hora").fill("18:00");
    await pickThe15th(page, add, "Termina");
    await add.getByLabel("Termina: hora").fill("10:00");
    await add.getByRole("button", { name: "Agregar jornada" }).click();

    await expect(
      add.getByText("El fin tiene que ser después del inicio."),
    ).toBeVisible();
    await expect(add.getByLabel("Empieza: hora")).toHaveValue("18:00");
    await expect(
      add.getByRole("button", { name: /^Termina: .* 15 / }),
    ).toBeVisible();
  });

  await test.step("fixed, it is added and the form empties", async () => {
    await add.getByLabel("Empieza: hora").fill("10:00");
    await add.getByLabel("Termina: hora").fill("18:00");
    await add.getByRole("button", { name: "Agregar jornada" }).click();

    await expect(page.getByText("Jornada agregada.")).toBeVisible();
    await expect(page.getByText(/10:00.18:00/).first()).toBeVisible();
    await expect(
      add.getByRole("button", { name: "Empieza: Elegí la fecha" }),
    ).toBeVisible();
  });

  await test.step("an existing one is corrected in place", async () => {
    const sheet = page.getByRole("dialog", { name: "Jornadas" });
    await sheet.getByText(/10:00.18:00/).click();
    const edit = sheet.locator("details[open]");
    await edit.getByLabel("Nombre").fill("Día de prueba");
    await edit.getByLabel("Termina: hora").fill("19:00");
    await edit.getByRole("button", { name: "Guardar jornada" }).click();

    await expect(page.getByText("Jornada guardada.")).toBeVisible();
    await page.keyboard.press("Escape");
    const general = page.getByRole("region", { name: "Jornadas" });
    await expect(general.getByText("Día de prueba")).toBeVisible();
    await expect(general.getByText(/10:00.19:00/)).toBeVisible();
  });
});

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

// A 1×1 PNG: all the upload needs.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const NAME = "Kiosco con logo";

test("a spot's logo goes from the form to the visitor's medals", async ({
  page,
  browser,
}) => {
  const admin = `http://localhost:3000/panel/${seed.org.slug}`;
  await page.goto(`${admin}/spots`);
  await signInByMail(page, seed.ownerEmail);

  await test.step("a spot imported from the v1 opens", async () => {
    await page.goto(`${admin}/spots/${seed.catalog[0]?.id}`);
    await page
      .getByRole("button", { name: "Editar Café de la Esquina" })
      .click();
    await expect(page.getByLabel("Nombre")).toHaveValue("Café de la Esquina");
  });

  // ?nuevo is how the event's Spots tab links here: the sheet opens on load.
  await page.goto(`${admin}/spots?nuevo`);
  const sheet = page.getByRole("dialog", { name: "Nuevo spot" });

  await test.step("the owner creates a spot with its logo", async () => {
    await sheet.getByLabel("Nombre").fill(NAME);
    await sheet.getByLabel("Logo").setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await sheet.getByRole("button", { name: "Crear spot" }).click();
    await expect(page.getByText("Spot creado.")).toBeVisible();
    // The sheet stays open, empty, to load the next one.
    await expect(sheet.getByLabel("Nombre")).toHaveValue("");
  });

  await test.step("and puts it in the published event", async () => {
    await page.goto(`${admin}/eventos/feria?tab=spots`);
    await page.getByRole("button", { name: "Agregar spots" }).click();
    const add = page.getByRole("dialog", {
      name: "Agregar desde el catálogo",
    });
    await add.getByRole("button", { name: "Spot del catálogo" }).click();
    await page.getByRole("option", { name: NAME }).click();
    await add.getByRole("button", { name: /Agregar/ }).click();
    // The code is generated, one past the event's last.
    const code = `A${String(seed.spots.length + 1).padStart(2, "0")}`;
    await expect(page.getByText(code, { exact: true })).toBeVisible();
  });

  const visitor = await browser.newPage();

  await test.step("the home shows it, and the file is served", async () => {
    await visitor.goto(`${seed.origin}/eventos/feria`);
    const logo = visitor
      .getByRole("figure", { name: new RegExp(NAME) })
      .locator("img");
    await expect(logo).toBeVisible();
    const src = await logo.getAttribute("src");
    expect(src).toContain(`/spot-logos/${seed.org.id}/`);
    expect((await visitor.request.get(src ?? "")).status()).toBe(200);
  });

  await test.step("so do the visitor's medals", async () => {
    await visitor.goto(`${seed.origin}/mis-medallas`);
    await signInByMail(visitor, seed.visitorEmail);
    await visitor.goto(`${seed.origin}/mis-medallas`);
    await expect(
      visitor.getByRole("figure", { name: new RegExp(NAME) }).locator("img"),
    ).toBeVisible();
  });

  await test.step("removing it leaves the catalog without a logo", async () => {
    await page.goto(`${admin}/spots`);
    await page.getByRole("link", { name: new RegExp(NAME) }).click();
    await page.getByRole("button", { name: `Editar ${NAME}` }).click();
    await expect(page.getByAltText("Logo actual")).toBeVisible();
    await page.getByLabel("Quitar el logo").check();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Cambios guardados.")).toBeVisible();
    await expect(page.getByAltText("Logo actual")).toHaveCount(0);
  });
});

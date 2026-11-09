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
  const admin = `http://app.localhost:3000/${seed.org.slug}`;
  await page.goto(`${admin}/spots/nuevo`);
  await signInByMail(page, seed.ownerEmail);

  await test.step("the owner creates a spot with its logo", async () => {
    await page.getByLabel("Nombre").fill(NAME);
    await page.getByLabel("Logo").setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await page.getByRole("button", { name: "Crear spot" }).click();
    await expect(page).toHaveURL(new RegExp(`/${seed.org.slug}/spots$`));
  });

  await test.step("and puts it in the published event", async () => {
    await page.goto(`${admin}/eventos/feria/spots`);
    const add = page.locator("form", {
      has: page.getByLabel("Spot del catálogo"),
    });
    await add.getByLabel("Spot del catálogo").selectOption({ label: NAME });
    await add.getByLabel("Código").fill("L01");
    await add.getByRole("button", { name: /Agregar/ }).click();
    await expect(page.getByText("L01", { exact: true })).toBeVisible();
  });

  const visitor = await browser.newPage();

  await test.step("the home shows it, and the file is served", async () => {
    await visitor.goto(`${seed.origin}/eventos/feria`);
    const logo = visitor.getByRole("img", { name: new RegExp(`^${NAME}:`) });
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
      visitor.getByRole("img", { name: new RegExp(`^${NAME}:`) }),
    ).toBeVisible();
  });

  await test.step("removing it leaves the catalog without a logo", async () => {
    await page.goto(`${admin}/spots`);
    await page.getByRole("link", { name: new RegExp(NAME) }).click();
    await expect(page.getByAltText("Logo actual")).toBeVisible();
    await page.getByLabel("Quitar el logo").check();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Cambios guardados.")).toBeVisible();
    await expect(page.getByAltText("Logo actual")).toHaveCount(0);
  });
});

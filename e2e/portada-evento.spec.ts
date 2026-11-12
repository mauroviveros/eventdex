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

test("an event's banner goes from the panel to the public home", async ({
  page,
  browser,
}) => {
  await page.goto(`http://app.localhost:3000/${seed.org.slug}/eventos/feria`);
  await signInByMail(page, seed.ownerEmail);
  const visitor = await browser.newPage();
  const cover = visitor.getByRole("img", { name: /^Cartel de / });

  await test.step("without a banner, the home has no image", async () => {
    await expect(page.getByText("Todavía no hay banner")).toBeVisible();
    await visitor.goto(`${seed.origin}/eventos/feria`);
    await expect(cover).toHaveCount(0);
  });

  // The banner is changed from the event's Editar sheet.
  const sheet = page.getByRole("dialog", { name: /^Editar / });

  await test.step("the owner uploads it", async () => {
    await page.getByRole("button", { name: "Editar Feria E2E" }).click();
    await sheet.locator('input[type="file"]').setInputFiles({
      name: "banner.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await sheet.getByRole("button", { name: "Subir banner" }).click();
    await expect(page.getByText("Banner actualizado.")).toBeVisible();
    await expect(sheet.getByAltText("Banner actual")).toBeVisible();
  });

  await test.step("the home shows it, and the file is served", async () => {
    await visitor.reload();
    await expect(cover).toBeVisible();
    const src = await cover.getAttribute("src");
    expect(src).toContain(`/event-covers/${seed.org.id}/`);
    expect((await visitor.request.get(src ?? "")).status()).toBe(200);
  });

  await test.step("removing it leaves the home as it was", async () => {
    await sheet.getByRole("button", { name: "Quitar banner" }).click();
    await page.getByRole("button", { name: "Sí, quitar" }).click();
    await expect(sheet.getByAltText("Banner actual")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByText("Todavía no hay banner")).toBeVisible();
    await visitor.reload();
    await expect(cover).toHaveCount(0);
  });
});

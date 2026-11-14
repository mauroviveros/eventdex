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

const PERK = "Una muestra gratis de café";
const NAME = "Café de la Esquina";

test("a perk loaded in the panel is a surprise until the medal, then a coupon once", async ({
  page,
  browser,
}) => {
  const [cafe] = seed.spots;
  if (!cafe) throw new Error("seed without spots");

  const staff = await browser.newPage();

  await test.step("staff loads a surprise perk for a stand", async () => {
    await staff.goto(
      `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}?tab=spots`,
    );
    await signInByMail(staff, seed.ownerEmail);
    await staff.getByRole("button", { name: `Editar ${NAME}` }).click();
    const sheet = staff.getByRole("dialog", { name: new RegExp(NAME) });
    await sheet.getByLabel("Beneficio", { exact: true }).fill(PERK);
    await sheet.getByLabel(/Beneficio sorpresa/).check();
    await sheet.getByRole("button", { name: "Guardar" }).click();
    await expect(staff.getByText("Cambios guardados.")).toBeVisible();
  });

  await staff.close();

  await test.step("signed out, the directory says there is a surprise and never the text", async () => {
    await page.goto(seed.origin);
    const stand = page.getByRole("button", { name: new RegExp(NAME) });
    await expect(stand).toContainText("Con sorpresa");
    // The text is not even in what the server sent.
    expect(await page.content()).not.toContain(PERK);
    await stand.click();
    const sheet = page.getByRole("dialog", { name: NAME });
    await expect(sheet).toContainText("Beneficio sorpresa");
    await expect(sheet).toContainText("Escaneá el QR del stand");
    await expect(sheet).not.toContainText(PERK);
    await page.keyboard.press("Escape");
  });

  await test.step("scanning reveals it as a coupon", async () => {
    await page.goto(`${seed.origin}/s/${cafe.id}`);
    await signInByMail(page, seed.visitorEmail);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
    await expect(page.getByText("Tu beneficio")).toBeVisible();
    await expect(page.getByText(PERK)).toBeVisible();
  });

  await test.step("scanning again does not repeat it, and points to the sheet", async () => {
    await page.goto(`${seed.origin}/s/${cafe.id}`);
    await expect(
      page.getByRole("heading", { name: "Esta ya la tenías" }),
    ).toBeVisible();
    await expect(page.getByText(PERK)).toHaveCount(0);
    await page
      .getByRole("link", { name: "Su beneficio está en la ficha del stand" })
      .click();
  });

  await test.step("the link opens the sheet, which keeps it for whoever holds the medal", async () => {
    const sheet = page.getByRole("dialog", { name: NAME });
    await expect(sheet).toContainText("Ya la tenés");
    await expect(sheet).toContainText("Tu beneficio");
    await expect(sheet).toContainText(PERK);
  });
});

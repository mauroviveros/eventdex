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

test.setTimeout(60_000);

test("the reports: the team prints the event's and a stand's, and nobody else reads them", async ({
  page,
  browser,
}) => {
  const [one] = seed.spots;
  if (!one) throw new Error("seed without spots");
  const staff = await browser.newPage();
  const base = `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}`;

  await test.step("with no medals there is nothing to report, and it says so", async () => {
    await staff.goto(`${base}/informe`);
    await signInByMail(staff, seed.ownerEmail);
    await expect(
      staff.getByRole("heading", { name: "Todavía no hay nada para informar" }),
    ).toBeVisible();
  });

  await test.step("a visitor's first medal", async () => {
    await page.goto(`${seed.origin}/s/${one.id}`);
    await signInByMail(page, seed.visitorEmail);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
  });

  await test.step("the Resumen leads to the event's report: figures, hours, loyalty and the cut", async () => {
    await staff.goto(base);
    await staff.getByRole("link", { name: "Informe del evento" }).click();
    await expect(staff).toHaveURL(/\/informe$/);
    const sheet = staff.locator("article");
    await expect(sheet).toContainText("Informe del evento");
    await expect(sheet.locator("dl")).toContainText("Visitantes1");
    await expect(
      sheet.getByRole("heading", { name: "Afluencia" }),
    ).toBeVisible();
    await expect(
      sheet.getByRole("heading", { name: "Fidelidad" }),
    ).toBeVisible();
    // The event is still running: the sheet says it is partial and when it was taken.
    await expect(sheet.getByText("Parcial")).toBeVisible();
    await expect(sheet).toContainText("Datos al");
  });

  await test.step("a stand's row leads to its own report, without another stand's code", async () => {
    await staff.goto(base);
    await staff
      .getByRole("link", { name: `Informe del stand ${one.code}` })
      .click();
    await expect(staff).toHaveURL(new RegExp(`/informe/${one.code}$`));
    const sheet = staff.locator("article");
    await expect(sheet).toContainText("Informe de stand");
    await expect(sheet.locator("dl")).toContainText("Visitas1");
    await expect(sheet.locator("dl")).toContainText("Primera parada1");
    await expect(
      sheet.getByRole("heading", { name: "Contra el promedio" }),
    ).toBeVisible();
    for (const other of seed.spots.filter((s) => s.id !== one.id)) {
      await expect(sheet).not.toContainText(other.code);
    }
  });

  await test.step("an unknown stand is a 404", async () => {
    const missing = await staff.goto(`${base}/informe/ZZ99`);
    expect(missing?.status()).toBe(404);
  });

  await test.step("without a session the report asks to sign in and shows nothing", async () => {
    const stranger = await browser.newPage();
    await stranger.goto(`${base}/informe`);
    await expect(stranger).toHaveURL(/ingresar/);
    await expect(stranger.locator("article")).toHaveCount(0);
  });
});

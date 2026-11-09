import { expect, test } from "@playwright/test";
import { signInByMail } from "./support/mailpit";
import { seedDeveloper, seedLiveEvent } from "./support/seed";

let seed: Awaited<ReturnType<typeof seedLiveEvent>>;
let developer: Awaited<ReturnType<typeof seedDeveloper>>;

test.beforeAll(async () => {
  [seed, developer] = await Promise.all([seedLiveEvent(), seedDeveloper()]);
});

test.afterAll(async () => {
  await seed?.cleanup();
  await developer?.cleanup();
});

const ADMIN = "http://app.localhost:3000/plataforma";

test("the developer bills an org, suspends it and sees it all audited", async ({
  page,
  browser,
}) => {
  await page.goto(`${ADMIN}/facturacion`);
  await signInByMail(page, developer.email);
  await expect(
    page.getByRole("heading", { name: "Facturación" }),
  ).toBeVisible();

  const concept = `Expo ${seed.org.slug}`;
  const row = page.getByRole("row", { name: concept });

  await test.step("a malformed amount is rejected with its reason", async () => {
    await page
      .getByLabel("Organización")
      .selectOption({ label: seed.org.name });
    await page.getByLabel("Concepto").fill(concept);
    await page.getByLabel("Monto").fill("1500.50");
    await page.getByRole("button", { name: "Registrar factura" }).click();
    await expect(page.getByText("Escribí el monto así")).toBeVisible();
    await expect(page.getByLabel("Concepto")).toHaveValue(concept);
  });

  await test.step("an invoice is registered and marked paid", async () => {
    await page.getByLabel("Monto").fill("1.500,50");
    await page.getByRole("button", { name: "Registrar factura" }).click();
    await expect(page.getByText("Factura registrada.")).toBeVisible();
    await expect(row).toContainText("1.500,50");
    await expect(row).toContainText("Pendiente");

    await row.getByRole("button", { name: `Marcar pagada ${concept}` }).click();
    await expect(row).toContainText("Pagada");
  });

  await test.step("suspending closes the org's domain, reactivating reopens it", async () => {
    await page.goto(`${ADMIN}/organizaciones/${seed.org.slug}`);
    await page.getByRole("button", { name: "Suspender" }).click();
    await page.getByRole("button", { name: "Sí, suspender" }).click();
    await expect(page.getByText("Suspendida")).toBeVisible();

    const visitor = await browser.newPage();
    const closed = await visitor.goto(seed.origin);
    expect(closed?.status()).toBe(404);

    await page.getByRole("button", { name: "Reactivar" }).click();
    await expect(page.getByRole("button", { name: "Suspender" })).toBeVisible();
    const open = await visitor.goto(seed.origin);
    expect(open?.status()).toBe(200);
    await visitor.close();
  });

  await test.step("every step is in the audit log, filterable", async () => {
    await page.goto(`${ADMIN}/auditoria`);
    await page
      .getByLabel("Organización")
      .selectOption({ label: seed.org.name });
    await page.getByLabel("Área").selectOption({ label: "Facturas" });
    await page.getByRole("button", { name: "Filtrar" }).click();

    const body = page.getByRole("table");
    await expect(body).toContainText("Factura pagada");
    await expect(body).toContainText("Factura registrada");
    await expect(body).toContainText(developer.email);
    await expect(body).not.toContainText("Organización suspendida");

    await page.getByLabel("Área").selectOption({ label: "Organizaciones" });
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(body).toContainText("Organización suspendida");
    await expect(body).toContainText("Organización reactivada");
  });
});

test("the platform does not exist for an owner", async ({ page }) => {
  await page.goto(`http://app.localhost:3000/${seed.org.slug}`);
  await signInByMail(page, seed.ownerEmail);
  await expect(
    page.getByRole("heading", { level: 1, name: seed.org.name }),
  ).toBeVisible();

  for (const path of ["", "/facturacion", "/auditoria"]) {
    const response = await page.goto(`${ADMIN}${path}`);
    expect(response?.status()).toBe(404);
  }
});

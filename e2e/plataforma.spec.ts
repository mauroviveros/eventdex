import { expect, test } from "@playwright/test";
import { signInByMail } from "./support/mailpit";
import { seedDeveloper, seedLiveEvent } from "./support/seed";

let seed: Awaited<ReturnType<typeof seedLiveEvent>>;
let other: Awaited<ReturnType<typeof seedLiveEvent>>;
let developer: Awaited<ReturnType<typeof seedDeveloper>>;

test.beforeAll(async () => {
  [seed, developer] = await Promise.all([seedLiveEvent(), seedDeveloper()]);
  other = await seedLiveEvent();
});

test.afterAll(async () => {
  await seed?.cleanup();
  await other?.cleanup();
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

test("the developer configures domains and moves one between orgs", async ({
  page,
}) => {
  await page.goto(`${ADMIN}/organizaciones/${seed.org.slug}`);
  await signInByMail(page, developer.email);

  const field = page.getByRole("textbox", { name: "Dominio", exact: true });
  const domain = (host: string) =>
    page.getByRole("listitem").filter({ hasText: host });
  const add = async (host: string, button = "Sumar dominio") => {
    await field.fill(host);
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(domain(host)).toBeVisible();
  };
  const moved = `mover-${seed.org.slug}.test`;
  const primary = `principal-${seed.org.slug}.test`;
  const removed = `quitar-${seed.org.slug}.test`;

  await test.step("a bad domain is explained, a good one is listed", async () => {
    await field.fill("https://mal/");
    await page.getByRole("button", { name: "Sumar dominio" }).click();
    await expect(page.getByText("Escribí solo el dominio")).toBeVisible();
    await add(moved);
    await expect(domain(moved)).not.toContainText("Principal");
  });

  await test.step("a domain can be added as primary", async () => {
    await add(primary, "Sumar y hacer principal");
    await expect(domain(primary)).toContainText("Principal");
  });

  await test.step("a non-primary domain is removed after confirming", async () => {
    await add(removed);
    await page.getByRole("button", { name: `Quitar ${removed}` }).click();
    await page.getByRole("button", { name: "Sí, quitar" }).click();
    await expect(domain(removed)).toHaveCount(0);
  });

  await test.step("a taken domain asks first, and can be cancelled", async () => {
    await page.goto(`${ADMIN}/organizaciones/${other.org.slug}`);
    await field.fill(moved);
    await page.getByRole("button", { name: "Sumar dominio" }).click();
    await expect(
      page.getByText(`${moved} ya es de ${seed.org.name}`),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sí, mover" })).toBeFocused();
    await expect(domain(moved)).toHaveCount(0);

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("button", { name: "Sí, mover" })).toHaveCount(
      0,
    );
    await expect(domain(moved)).toHaveCount(0);
  });

  await test.step("once confirmed it moves, and can become primary", async () => {
    await page.getByRole("button", { name: "Sumar dominio" }).click();
    await page.getByRole("button", { name: "Sí, mover" }).click();
    await expect(domain(moved)).toBeVisible();

    await page
      .getByRole("button", { name: `Hacer principal ${moved}` })
      .click();
    await page.getByRole("button", { name: "Sí, hacer principal" }).click();
    await expect(domain(moved)).toContainText("Principal");

    await page.goto(`${ADMIN}/organizaciones/${seed.org.slug}`);
    await expect(domain(moved)).toHaveCount(0);
    await expect(domain(primary)).toContainText("Principal");
  });
});

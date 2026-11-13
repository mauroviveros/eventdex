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

const ADMIN = "http://localhost:3000/panel/plataforma";

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
  const row = page.getByRole("row").filter({ hasText: concept });
  // Nueva factura opens a side sheet; each invoice's actions live behind its ⋮.
  const sheet = page.getByRole("dialog", { name: "Nueva factura" });

  await test.step("a malformed amount is rejected with its reason", async () => {
    await page.getByRole("button", { name: "Nueva factura" }).click();
    await sheet
      .getByLabel("Organización")
      .selectOption({ label: seed.org.name });
    await sheet.getByLabel("Concepto").fill(concept);
    await sheet.getByLabel("Monto").fill("1500.50");
    await sheet.getByRole("button", { name: "Registrar factura" }).click();
    await expect(sheet.getByText("Escribí el monto así")).toBeVisible();
    await expect(sheet.getByLabel("Concepto")).toHaveValue(concept);
  });

  await test.step("an invoice is registered and marked paid", async () => {
    await sheet.getByLabel("Monto").fill("1.500,50");
    await sheet.getByRole("button", { name: "Registrar factura" }).click();
    await expect(page.getByText("Factura registrada.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(row).toContainText("1.500,50");
    await expect(row).toContainText("Pendiente");

    await page.getByRole("button", { name: `Acciones de ${concept}` }).click();
    await page.getByRole("menuitem", { name: "Marcar pagada" }).click();
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
  await page.goto(`http://localhost:3000/panel/${seed.org.slug}`);
  await signInByMail(page, seed.ownerEmail);
  await expect(
    page.getByRole("heading", { level: 1, name: "Eventos" }),
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

  // Domains are added from a side sheet; each one's actions live behind its ⋮.
  const sheet = page.getByRole("dialog", { name: "Sumar un dominio" });
  const field = sheet.getByRole("textbox", { name: "Dominio", exact: true });
  const open = () =>
    page.getByRole("button", { name: "Sumar dominio" }).click();
  const close = () => page.keyboard.press("Escape");
  // In the page, not in the toasts (also a list) that name the domain.
  const domain = (host: string) =>
    page.getByRole("main").getByRole("listitem").filter({ hasText: host });
  const rowAction = async (host: string, action: string) => {
    await page.getByRole("button", { name: `Acciones de ${host}` }).click();
    await page.getByRole("menuitem", { name: action }).click();
  };
  const add = async (host: string) => {
    await open();
    await field.fill(host);
    await sheet.getByRole("button", { name: "Sumar dominio" }).click();
    await expect(page.getByText("Dominio sumado.").last()).toBeVisible();
    await close();
    await expect(domain(host)).toBeVisible();
  };
  const moved = `mover-${seed.org.slug}.test`;
  const primary = `principal-${seed.org.slug}.test`;
  const removed = `quitar-${seed.org.slug}.test`;

  await test.step("a bad domain is explained, a good one is listed", async () => {
    await open();
    await field.fill("https://mal/");
    await sheet.getByRole("button", { name: "Sumar dominio" }).click();
    await expect(sheet.getByText("Escribí solo el dominio")).toBeVisible();
    await close();
    await add(moved);
    await expect(domain(moved)).not.toContainText("Principal");
  });

  await test.step("a domain added as primary asks first", async () => {
    await open();
    await field.fill(primary);
    await sheet
      .getByRole("button", { name: "Sumar y hacer principal" })
      .click();
    const confirm = sheet.getByRole("button", { name: "Sí, hacer principal" });
    await expect(confirm).toBeFocused();

    await sheet.getByRole("button", { name: "Cancelar" }).click();
    await sheet
      .getByRole("button", { name: "Sumar y hacer principal" })
      .click();
    await confirm.click();
    await expect(page.getByText("Dominio sumado.").last()).toBeVisible();
    await close();
    await expect(domain(primary)).toContainText("Principal");
  });

  await test.step("a non-primary domain is removed after confirming", async () => {
    await add(removed);
    await rowAction(removed, "Quitar");
    await page.getByRole("button", { name: "Sí, quitar" }).click();
    await expect(domain(removed)).toHaveCount(0);
  });

  await test.step("a taken domain asks first, and can be cancelled", async () => {
    await page.goto(`${ADMIN}/organizaciones/${other.org.slug}`);
    await open();
    await field.fill(moved);
    await sheet.getByRole("button", { name: "Sumar dominio" }).click();
    await expect(
      sheet.getByText(`${moved} ya es de ${seed.org.name}`),
    ).toBeVisible();
    await expect(
      sheet.getByRole("button", { name: "Sí, mover" }),
    ).toBeFocused();

    await field.press("Enter");
    await expect(
      sheet.getByRole("button", { name: "Sí, mover" }),
    ).toBeVisible();

    await sheet.getByRole("button", { name: "Cancelar" }).click();
    await expect(sheet.getByRole("button", { name: "Sí, mover" })).toHaveCount(
      0,
    );
    await close();
    await expect(domain(moved)).toHaveCount(0);
  });

  await test.step("once confirmed it moves, and can become primary", async () => {
    await open();
    await field.fill(moved);
    await sheet.getByRole("button", { name: "Sumar dominio" }).click();
    await sheet.getByRole("button", { name: "Sí, mover" }).click();
    await expect(page.getByText("Dominio sumado.").last()).toBeVisible();
    await close();
    await expect(domain(moved)).toBeVisible();

    await rowAction(moved, "Hacer principal");
    await page.getByRole("button", { name: "Sí, hacer principal" }).click();
    await expect(domain(moved)).toContainText("Principal");

    await page.goto(`${ADMIN}/organizaciones/${seed.org.slug}`);
    await expect(domain(moved)).toHaveCount(0);
    await expect(domain(primary)).toContainText("Principal");
  });
});

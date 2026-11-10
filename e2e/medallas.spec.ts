import { expect, test } from "@playwright/test";
import { signInByMail } from "./support/mailpit";
import { seedLiveEvent } from "./support/seed";

type Seed = Awaited<ReturnType<typeof seedLiveEvent>>;
let seed: Seed;

test.beforeAll(async () => {
  seed = await seedLiveEvent();
});

test.afterAll(async () => {
  await seed?.cleanup();
});

test("a visitor scans a QR, signs in, collects, and staff can block them", async ({
  page,
  browser,
}) => {
  const [cafe, rueda] = seed.spots;
  if (!cafe || !rueda) throw new Error("seed without spots");

  await test.step("scanning without a session asks to sign in and comes back", async () => {
    await page.goto(`${seed.origin}/s/${cafe.id}`);
    await expect(page).toHaveURL(/\/ingresar\?next=%2Fs%2F/);
    await expect(
      page.getByRole("heading", { name: "Ingresá para sumar la medalla" }),
    ).toBeVisible();

    await signInByMail(page, seed.visitorEmail);
    await expect(page).toHaveURL(`${seed.origin}/s/${cafe.id}`);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: "Medallas juntadas" }),
    ).toHaveAttribute("aria-valuetext", "1 de 2 medallas");
    await expect(
      page.getByText("¡Ya tenés 1! Buscá el próximo QR."),
    ).toBeVisible();
  });

  await test.step("scanning again keeps one medal", async () => {
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Esta ya la tenías" }),
    ).toBeVisible();
  });

  await test.step("the collection shows it, reached from the account menu", async () => {
    // The menu's summary: its visible text is the visitor, "Tu cuenta" is for screen readers.
    await page.locator("header summary").click();
    await page.getByRole("link", { name: "Mis medallas", exact: true }).click();
    await expect(page).toHaveURL(`${seed.origin}/mis-medallas`);
    const collection = page.getByRole("list", { name: "Tu colección" });
    await expect(
      collection.getByRole("figure", {
        name: /Café de la Esquina.*Conseguida/,
      }),
    ).toBeVisible();
    await expect(
      collection.getByRole("figure", { name: /Rueda gigante.*Te falta/ }),
    ).toBeVisible();

    const card = page.getByRole("region", { name: "Tu tarjeta de visitante" });
    await expect(card.getByRole("heading")).toHaveText("Feria E2E");
    await expect(card).toContainText("1 medalla");
    await expect(card).not.toContainText(seed.visitorEmail);
  });

  await test.step("the event's page shows what the visitor already has", async () => {
    await page.goto(`${seed.origin}/eventos/${seed.event.slug}`);
    await expect(
      page.getByRole("heading", { name: "Medallas: 1 de 2" }),
    ).toBeVisible();
    await expect(
      page.getByRole("figure", { name: /Café de la Esquina.*Conseguida/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("figure", { name: /Rueda gigante.*Te falta/ }),
    ).toBeVisible();
  });

  await test.step("staff sees the visitor in the admin and blocks them", async () => {
    // Another browser: the admin's session lives on its own domain.
    const staff = await browser.newPage();
    await staff.goto(
      `http://app.localhost:3000/${seed.org.slug}/eventos/${seed.event.slug}/visitantes`,
    );
    await signInByMail(staff, seed.ownerEmail);

    const row = staff.getByRole("listitem").filter({
      hasText: seed.visitorEmail,
    });
    await expect(row).toContainText("1");
    await row.getByRole("button", { name: /^Bloquear a / }).click();
    await staff.getByRole("button", { name: "Sí, bloquear" }).click();
    await expect(row).toContainText("Bloqueado");
    await staff.close();
  });

  await test.step("a blocked visitor collects no more", async () => {
    await page.goto(`${seed.origin}/s/${rueda.id}`);
    await expect(
      page.getByRole("heading", { name: "No podés sumar medallas" }),
    ).toBeVisible();
  });
});

test("a visitor picks which event's collection to see", async ({ page }) => {
  const own = await seedLiveEvent();
  try {
    const [cafe] = own.spots;
    await page.goto(`${own.origin}/s/${cafe?.id}`);
    await signInByMail(page, own.visitorEmail);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
    await own.addPastCollection();

    await page.goto(`${own.origin}/mis-medallas`);
    const picker = page.getByRole("navigation", { name: "Tus eventos" });
    const collection = page.getByRole("list", { name: "Tu colección" });
    await expect(
      picker.getByRole("link", { name: "Feria E2E", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      collection.getByRole("figure", {
        name: /Café de la Esquina.*Conseguida/,
      }),
    ).toBeVisible();

    await picker.getByRole("link", { name: "Feria E2E · Abril" }).click();
    await expect(page).toHaveURL(/\?evento=feria-vieja$/);
    await expect(
      collection.getByRole("figure", { name: /Stand viejo.*Conseguida/ }),
    ).toBeVisible();

    await page.goto(`${own.origin}/mis-medallas?evento=no-existe`);
    await expect(
      collection.getByRole("figure", {
        name: /Café de la Esquina.*Conseguida/,
      }),
    ).toBeVisible();
  } finally {
    await own.cleanup();
  }
});

test("a QR of another org or a broken one is a 404, without asking to sign in", async ({
  page,
}) => {
  const other = await page.goto(
    `${seed.origin}/s/00000000-0000-4000-8000-000000000000`,
  );
  expect(other?.status()).toBe(404);
  const broken = await page.goto(`${seed.origin}/s/no-es-un-qr`);
  expect(broken?.status()).toBe(404);
});

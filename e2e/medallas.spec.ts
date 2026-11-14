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

  await test.step("scanning without a session shows the locked medal, signs in there and comes back", async () => {
    await page.goto(`${seed.origin}/s/${cafe.id}`);
    await expect(page).toHaveURL(`${seed.origin}/s/${cafe.id}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "¡Bien ahí!" }),
    ).toBeVisible();
    await expect(page.getByText("Café de la Esquina")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ingresá con Google para sumarla" }),
    ).toBeVisible();
    // The page is the sign-in: the header doesn't repeat it.
    await expect(
      page.locator("header").getByText("Ingresar", { exact: true }),
    ).toHaveCount(0);

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

  await test.step("the card can be shared as a private image", async () => {
    const url = `${seed.origin}/mis-medallas/tarjeta?evento=${seed.event.slug}`;
    const image = await page.request.get(url);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toBe("image/png");
    expect(image.headers()["cache-control"]).toBe("private, no-store");

    const unknown = await page.request.get(
      `${seed.origin}/mis-medallas/tarjeta?evento=no-existe`,
    );
    expect(unknown.status()).toBe(404);

    const stranger = await browser.newContext();
    const denied = await stranger.request.get(url, { maxRedirects: 0 });
    expect(denied.status()).toBe(307);
    await stranger.close();

    // Without the share sheet, as on a desktop browser, the image downloads.
    await page.evaluate(() => {
      Object.defineProperty(navigator, "canShare", { value: undefined });
    });
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Compartir mi tarjeta" }).click();
    expect((await download).suggestedFilename()).toBe(
      `tarjeta-${seed.event.slug}.png`,
    );
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
      `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}?tab=visitantes`,
    );
    await signInByMail(staff, seed.ownerEmail);

    // The table sorts by medals through the URL; on a phone, from its picker.
    await staff
      .getByLabel("Ordenar por")
      .selectOption({ label: "Medallas (descendente)" });
    await expect(staff).toHaveURL(/orden=medallas&dir=desc/);
    await expect(staff.getByLabel("Ordenar por")).toHaveValue("medallas:desc");

    const row = staff.getByRole("row").filter({
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

test("a failed Google sign-in from a QR comes back to the locked medal", async ({
  page,
}) => {
  const [cafe] = seed.spots;
  if (!cafe) throw new Error("seed without spots");

  // Google sent the visitor back without a code (cancelled or refused).
  await page.goto(
    `${seed.origin}/auth/callback?next=${encodeURIComponent(`/s/${cafe.id}`)}`,
  );
  await expect(page).toHaveURL(`${seed.origin}/s/${cafe.id}?error=auth`);
  await expect(
    page.getByRole("heading", { level: 1, name: "¡Bien ahí!" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "No pudimos completar el ingreso" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ingresá con Google para sumarla" }),
  ).toBeVisible();

  // Anywhere else, the error lands on /ingresar, which keeps where it was going.
  await page.goto(`${seed.origin}/auth/callback?next=%2Fmis-medallas`);
  await expect(page).toHaveURL(
    `${seed.origin}/ingresar?error=auth&next=%2Fmis-medallas`,
  );
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "No pudimos completar el ingreso" }),
  ).toBeVisible();
});

import { expect, test } from "@playwright/test";
import { signInByMail } from "./support/mailpit";
import { seedDeveloper, seedLiveEvent } from "./support/seed";

let seed: Awaited<ReturnType<typeof seedLiveEvent>>;
let parallel: Awaited<ReturnType<typeof seed.addSecondLiveEvent>>;
let developer: Awaited<ReturnType<typeof seedDeveloper>>;

test.beforeAll(async () => {
  seed = await seedLiveEvent();
  await seed.addDraft();
  parallel = await seed.addSecondLiveEvent();
  developer = await seedDeveloper();
  for (const spot of [seed.spots[0], parallel.spot])
    if (spot) await seed.setPerk(spot.id, "Un café de regalo");
});

test.afterAll(async () => {
  await seed?.cleanup();
  await developer?.cleanup();
});

test("the org has one page: an event's own URL is a 404", async ({ page }) => {
  for (const slug of ["feria", "feria-paralela", "no-existe"]) {
    const response = await page.goto(`${seed.origin}/eventos/${slug}`);
    expect(response?.status(), slug).toBe(404);
  }
});

test("the team sees a draft's page from the panel, and a stranger does not", async ({
  page,
  browser,
}) => {
  const preview = `http://localhost:3000/panel/${seed.org.slug}/eventos/feria-borrador/portada`;

  await test.step("a member reads it, marked as a draft, in the org's name", async () => {
    await page.goto(preview);
    await signInByMail(page, seed.ownerEmail);
    await expect(page).toHaveURL(preview);
    await expect(
      page.getByRole("heading", { name: "Feria Borrador", level: 1 }),
    ).toBeVisible();
    const bar = page.getByRole("navigation", { name: "Vista del equipo" });
    await expect(bar).toContainText("Borrador");
    await expect(
      bar.getByRole("link", { name: "Volver al evento" }),
    ).toBeVisible();
    // The org's own mark heads the page, and it stays out of the search index.
    await expect(page.getByRole("link", { name: seed.org.name })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  await test.step("the phase menu reads it as upcoming, in course or finished", async () => {
    const bar = page.getByRole("navigation", { name: "Vista del equipo" });
    await bar.getByRole("button", { name: /Fase/ }).click();
    await page.getByRole("menuitem", { name: "En curso" }).click();
    await expect(page).toHaveURL(/fase=en-curso/);
    await expect(page.getByRole("main").getByText("En curso")).toBeVisible();
  });

  await test.step("the platform's developer reads it too, in support mode", async () => {
    const support = await browser.newPage();
    await support.goto(preview);
    await signInByMail(support, developer.email);
    await expect(support).toHaveURL(preview);
    await expect(
      support.getByRole("heading", { name: "Feria Borrador", level: 1 }),
    ).toBeVisible();
    await support.close();
  });

  await test.step("someone without a session is sent to sign in, and never sees it", async () => {
    const stranger = await browser.newPage();
    await stranger.goto(preview);
    await expect(stranger).toHaveURL(/ingresar/);
    await expect(
      stranger.getByRole("heading", { name: "Feria Borrador" }),
    ).toHaveCount(0);
    await stranger.close();
  });
});

test("a medal links back to the page only when its event is the one the page shows", async ({
  page,
}) => {
  const [cafe] = seed.spots;
  if (!cafe) throw new Error("seed without spots");

  await test.step("the active event's medal, held again, points to the stand's sheet on the page", async () => {
    await page.goto(`${seed.origin}/s/${cafe.id}`);
    await signInByMail(page, seed.visitorEmail);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Esta ya la tenías" }),
    ).toBeVisible();
    await expect(page.locator(`a[href="/#ficha=${cafe.id}"]`)).toBeVisible();
  });

  await test.step("another event's medal has no page to link to, only Mis medallas", async () => {
    await page.goto(`${seed.origin}/s/${parallel.spot.id}`);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Esta ya la tenías" }),
    ).toBeVisible();
    await expect(
      page.locator('a[href*="#ficha"], a[href*="/eventos/"]'),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Ver mis medallas" }),
    ).toHaveAttribute("href", "/mis-medallas?evento=feria-paralela");
  });
});

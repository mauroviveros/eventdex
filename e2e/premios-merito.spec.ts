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

const FIRST = "Primero en completar";
const HALF = "Mitad del camino";

test.setTimeout(60_000);

test("merit awards: staff creates them, the scan wins them, everyone sees them", async ({
  page,
  browser,
}) => {
  const [one, two] = seed.spots;
  if (!one || !two) throw new Error("seed without two spots");
  const staff = await browser.newPage();

  await test.step("staff creates an award with a cap and one without", async () => {
    await staff.goto(
      `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}?tab=sorteo`,
    );
    await signInByMail(staff, seed.ownerEmail);
    const section = staff.getByRole("region", { name: "Premios por mérito" });
    // Each award also carries its own edit form, with its own "Premio" field.
    const add = section.locator("form").filter({
      has: staff.getByRole("button", { name: "Crear premio" }),
    });
    await expect(
      section.getByText("Todavía no hay premios por mérito"),
    ).toBeVisible();

    await add.getByLabel("Nombre", { exact: true }).fill(FIRST);
    await add.getByLabel("Porcentaje o cantidad").fill("100");
    await add.getByLabel("Cupo (opcional)").fill("1");
    // Enter, not the button: on a phone the button can land under a toast or the dev tools badge.
    await add.getByLabel("Cupo (opcional)").press("Enter");
    await expect(staff.getByText("Premio creado.")).toBeVisible();
    // The form clears itself once it saved: type the next one after that.
    await expect(add.getByLabel("Nombre", { exact: true })).toHaveValue("");

    await add.getByLabel("Nombre", { exact: true }).fill(HALF);
    await add.getByLabel("Porcentaje o cantidad").fill("50");
    await add.getByLabel("Porcentaje o cantidad").press("Enter");
    await expect(
      section.getByRole("heading", { name: HALF, level: 3 }),
    ).toBeVisible();
    await expect(add.getByLabel("Nombre", { exact: true })).toHaveValue("");
  });

  await test.step("a percentage over 100 is refused", async () => {
    const section = staff.getByRole("region", { name: "Premios por mérito" });
    const add = section.locator("form").filter({
      has: staff.getByRole("button", { name: "Crear premio" }),
    });
    await add.getByLabel("Nombre", { exact: true }).fill("Demasiado");
    await add.getByLabel("Porcentaje o cantidad").fill("150");
    // Enter, not the button: the last toast still sits over it on a phone.
    await add.getByLabel("Porcentaje o cantidad").press("Enter");
    await expect(
      section.getByText("El porcentaje llega hasta 100."),
    ).toBeVisible();
  });

  await test.step("signed out, the page shows both with their places", async () => {
    await page.goto(seed.origin);
    const prizes = page.getByRole("region", { name: "Premios" });
    await expect(prizes).toContainText("Por mérito · Quedan 1 de 1");
    await expect(prizes).toContainText("Por mérito · Sin cupo");
    await expect(prizes).toContainText(
      "Juntá todas las medallas antes que nadie.",
    );
  });

  await test.step("the first medal crosses the half and wins it", async () => {
    await page.goto(`${seed.origin}/s/${one.id}`);
    await signInByMail(page, seed.visitorEmail);
    await expect(
      page.getByRole("heading", { name: "¡Ganaste!" }),
    ).toBeVisible();
    await expect(page.getByText(HALF)).toBeVisible();
    await expect(page.getByText(/Pasá por la organización/)).toBeVisible();
  });

  await test.step("the last one completes it: first place of one", async () => {
    await page.goto(`${seed.origin}/s/${two.id}`);
    await expect(
      page.getByRole("heading", { name: "¡Ganaste!" }),
    ).toBeVisible();
    // What a screen reader hears: the "#1" on screen is hidden from it.
    await expect(page.getByText(/Lugar 1 de 1/)).toBeVisible();
    await expect(page.getByText(FIRST)).toBeVisible();
  });

  await test.step("scanning again wins nothing and says it was already theirs", async () => {
    await page.goto(`${seed.origin}/s/${two.id}`);
    await expect(
      page.getByRole("heading", { name: "Esta ya la tenías" }),
    ).toBeVisible();
  });

  await test.step("the page and Mis medallas show what they won, the cap is full", async () => {
    await page.goto(seed.origin);
    const prizes = page.getByRole("region", { name: "Premios" });
    await expect(prizes).toContainText("Ganado · lugar 1");
    await page.goto(`${seed.origin}/mis-medallas`);
    // Both awards are theirs: the one with a cap and the one without.
    await expect(page.getByText("Ganado · lugar 1")).toHaveCount(2);
    await expect(
      page.getByText("Retiralo en la organización.").first(),
    ).toBeVisible();

    // A stranger finds the capped one full.
    const stranger = await browser.newPage();
    await stranger.goto(seed.origin);
    await expect(
      stranger.getByRole("region", { name: "Premios" }),
    ).toContainText("Se agotó");
    await stranger.close();
  });

  await test.step("the card still renders", async () => {
    const response = await page.request.get(
      `${seed.origin}/mis-medallas/tarjeta?evento=${seed.event.slug}`,
    );
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  });

  await test.step("staff sees who won, and cannot remove what was won", async () => {
    await staff.reload();
    const first = staff.getByRole("article", { name: FIRST });
    await expect(first).toContainText("ganaron 1 de 1");
    await expect(
      first.getByRole("list", { name: `Ganadores de ${FIRST}` }),
    ).toContainText(seed.visitorEmail);
    await expect(
      first.getByRole("button", { name: `Quitar ${FIRST}` }),
    ).toHaveCount(0);
  });

  await staff.close();
});

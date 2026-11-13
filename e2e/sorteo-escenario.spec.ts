import { expect, type Page, test } from "@playwright/test";
import { signInByMail } from "./support/mailpit";
import { seedLiveEvent } from "./support/seed";

let seed: Awaited<ReturnType<typeof seedLiveEvent>>;

test.beforeAll(async () => {
  seed = await seedLiveEvent();
});

test.afterAll(async () => {
  await seed?.cleanup();
});

async function createRaffle(staff: Page, title: string) {
  await staff.getByLabel("Premio").fill(title);
  await staff.getByRole("button", { name: "Crear sorteo" }).click();
  await expect(staff.getByRole("heading", { name: title })).toBeVisible();
  return staff.getByRole("region", { name: title });
}

test("staff draws from the stage screen, and the winner is the one in the panel", async ({
  page,
  browser,
}) => {
  const [cafe] = seed.spots;
  if (!cafe) throw new Error("seed without spots");

  await test.step("a visitor collects a medal", async () => {
    await page.goto(`${seed.origin}/s/${cafe.id}`);
    await signInByMail(page, seed.visitorEmail);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
  });

  const staff = await browser.newPage();
  const tab = `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}?tab=sorteo`;
  await staff.goto(tab);
  await signInByMail(staff, seed.ownerEmail);
  await staff.goto(tab);

  await test.step("a raffle opens on the stage, without the panel's bar", async () => {
    await createRaffle(staff, "Entradas");
    await staff.getByRole("link", { name: "Proyectar Entradas" }).click();
    await expect(staff).toHaveURL(/\/sorteo\/proyectar\?sorteo=/);
    await expect(
      staff.getByRole("heading", { level: 1, name: "Entradas" }),
    ).toBeVisible();
    await expect(staff.getByText("Listo para sortear")).toBeVisible();
    await expect(
      staff.getByRole("navigation", { name: "Secciones" }),
    ).toHaveCount(0);
  });

  await test.step("drawing lands on the winner, and announces only that", async () => {
    await staff.getByRole("button", { name: "Sortear", exact: true }).click();
    // Nothing is announced while the names go by.
    await expect(staff.locator("main").getByRole("status")).toHaveText(
      "Sorteando.",
    );
    await expect(staff.locator("main").getByRole("status")).toHaveText(
      "Ganador: Visitante",
      { timeout: 15_000 },
    );
    await expect(staff.getByText("Extracción 1")).toBeVisible();
    // The only participant just won: there is nobody else to draw.
    await expect(staff.getByRole("button", { name: /^Sortear/ })).toHaveCount(
      0,
    );
  });

  await test.step("the panel shows that same draw", async () => {
    await staff.getByRole("link", { name: "Volver al sorteo" }).click();
    await expect(staff).toHaveURL(/tab=sorteo/);
    const raffle = staff.getByRole("region", { name: "Entradas" });
    await expect(raffle).toContainText("Extracción 1");
    await expect(raffle).toContainText(seed.visitorEmail);
  });

  await test.step("with reduced motion the winner lands without the show", async () => {
    await staff.emulateMedia({ reducedMotion: "reduce" });
    await createRaffle(staff, "Remera");
    await staff.getByRole("link", { name: "Proyectar Remera" }).click();
    await staff.getByRole("button", { name: "Sortear", exact: true }).click();
    // The animation takes about four seconds: this is well before it ends.
    await expect(staff.locator("main").getByRole("status")).toHaveText(
      "Ganador: Visitante",
      { timeout: 2500 },
    );
  });

  await test.step("a raffle that is not this event's, or is made up, is a 404", async () => {
    const base = `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}/sorteo/proyectar`;
    const missing = await staff.request.get(
      `${base}?sorteo=00000000-0000-4000-8000-000000000000`,
    );
    expect(missing.status()).toBe(404);
  });

  await staff.close();
});

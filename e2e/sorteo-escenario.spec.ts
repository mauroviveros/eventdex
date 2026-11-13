import { expect, type Page, type Route, test } from "@playwright/test";
import { signInByMail } from "./support/mailpit";
import { seedLiveEvent } from "./support/seed";

let seed: Awaited<ReturnType<typeof seedLiveEvent>>;

test.beforeAll(async () => {
  seed = await seedLiveEvent();
  // A second event in the same org, for a raffle that isn't its own.
  await seed.addDraft();
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
  // Four draws with their show, one after another: the default 30 s doesn't fit.
  test.setTimeout(120_000);
  const [cafe] = seed.spots;
  if (!cafe) throw new Error("seed without spots");

  await test.step("a visitor collects a medal", async () => {
    await page.goto(`${seed.origin}/s/${cafe.id}`);
    await signInByMail(page, seed.visitorEmail);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
  });

  let entradasId: string | null = null;
  const staff = await browser.newPage();
  const tab = `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}?tab=sorteo`;
  await staff.goto(tab);
  await signInByMail(staff, seed.ownerEmail);
  await staff.goto(tab);

  await test.step("a raffle opens on the stage, without the panel's bar", async () => {
    await createRaffle(staff, "Entradas");
    const open = staff.getByRole("link", { name: "Proyectar Entradas" });
    entradasId = new URL(
      (await open.getAttribute("href")) ?? "",
      "http://localhost:3000",
    ).searchParams.get("sorteo");
    await open.click();
    await expect(staff).toHaveURL(/\/sorteo\/proyectar\?sorteo=/);
    await expect(
      staff.getByRole("heading", { level: 1, name: "Entradas" }),
    ).toBeVisible();
    await expect(
      staff.getByText("Presioná el botón para comenzar el sorteo"),
    ).toBeVisible();
    // The header counts who takes part and the medals in play; the list is names only.
    await expect(staff.getByText("participa ·")).toBeVisible();
    await expect(staff.getByText("medalla en juego")).toBeVisible();
    await expect(staff.getByText("Participaron 1")).toBeVisible();
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
    await expect(staff.getByText("Ganador n.º 1")).toBeVisible();
    // The Sortear button is gone, so the focus goes to the winner, not to nowhere.
    const winner = staff.locator("main p[tabindex='-1']");
    await expect(winner).toHaveText("Visitante");
    await expect(winner).toBeFocused();
    await expect(staff.getByText("1 medalla", { exact: true })).toBeVisible();
    // Reloading doesn't forget who won.
    await staff.reload();
    await expect(staff.getByText("Ganador n.º 1")).toBeVisible();
    await expect(staff.locator("main p[tabindex='-1']")).toHaveText(
      "Visitante",
    );
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

  await test.step("a lost connection says so instead of inviting a second draw", async () => {
    await staff.goto(tab);
    await createRaffle(staff, "Gorra");
    await staff.getByRole("link", { name: "Proyectar Gorra" }).click();
    const isStage = (url: URL) => url.pathname.endsWith("/sorteo/proyectar");
    const cut = (route: Route) =>
      route.request().method() === "POST"
        ? route.abort("connectionreset")
        : route.continue();
    await staff.route(isStage, cut);
    await staff.getByRole("button", { name: "Sortear", exact: true }).click();
    await expect(staff.getByText("Se cortó la conexión")).toBeVisible();
    await expect(staff.getByText("Mirá la pestaña Sorteo")).toBeVisible();
    await staff.unroute(isStage, cut);
  });

  await test.step("two quick taps draw once", async () => {
    await staff
      .getByRole("button", { name: "Sortear", exact: true })
      .dblclick();
    await expect(staff.locator("main").getByRole("status")).toHaveText(
      "Ganador: Visitante",
    );
    // A second draw would have failed (nobody else is left) and said so here.
    await expect(staff.getByText("No hay participantes")).toHaveCount(0);
    await expect(staff.getByText("Ganador n.º 1")).toBeVisible();
  });

  await test.step("a raffle of another event, or a made-up one, is a 404", async () => {
    const stage = (event: string, raffle: string) =>
      `http://localhost:3000/panel/${seed.org.slug}/eventos/${event}/sorteo/proyectar?sorteo=${raffle}`;
    const made = await staff.request.get(
      stage(seed.event.slug, "00000000-0000-4000-8000-000000000000"),
    );
    expect(made.status()).toBe(404);
    // Entradas is this event's: under the draft's address it doesn't exist.
    if (!entradasId) throw new Error("no raffle id");
    const other = await staff.request.get(stage("feria-borrador", entradasId));
    expect(other.status()).toBe(404);
    const own = await staff.request.get(stage(seed.event.slug, entradasId));
    expect(own.status()).toBe(200);
  });

  await staff.close();
});

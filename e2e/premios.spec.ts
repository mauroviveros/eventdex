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

// A 1×1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

test("the visitor sees what is won and how far they are, from the event to Mis medallas", async ({
  page,
  browser,
}) => {
  const [cafe] = seed.spots;
  if (!cafe) throw new Error("seed without spots");

  const staff = await browser.newPage();

  await test.step("staff creates a prize that asks for both medals and describes it", async () => {
    await staff.goto(
      `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}?tab=sorteo`,
    );
    await signInByMail(staff, seed.ownerEmail);
    await staff.getByLabel("Premio").fill("Tablet");
    await staff.getByLabel("Medallas para participar").fill("2");
    await staff.getByRole("button", { name: "Crear sorteo" }).click();
    const raffle = staff.getByRole("region", { name: "Tablet" });
    await expect(raffle).toContainText("Hacen falta 2 medallas");

    await raffle.getByText("Descripción e imagen", { exact: true }).click();
    await raffle
      .getByRole("textbox", { name: "Descripción" })
      .fill("Con funda y cargador");
    await raffle.getByLabel("Imagen", { exact: true }).setInputFiles({
      name: "tablet.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await raffle.getByRole("button", { name: "Guardar" }).click();
    await expect(
      raffle.getByRole("img", { name: "Imagen actual del premio" }),
    ).toBeVisible();
  });

  await test.step("a prize nobody can reach is flagged to staff and hidden from visitors", async () => {
    await staff.getByLabel("Premio").fill("Viaje");
    await staff.getByLabel("Medallas para participar").fill("9");
    await staff.getByRole("button", { name: "Crear sorteo" }).click();
    await expect(staff.getByRole("region", { name: "Viaje" })).toContainText(
      "Pide más medallas que stands activos",
    );
  });
  await staff.close();

  await test.step("signed out, the event shows the prize with its picture and what to do", async () => {
    await page.goto(seed.origin);
    const prizes = page.getByRole("region", { name: "Premios" });
    await expect(prizes).toContainText("Tablet");
    await expect(prizes).toContainText("Con funda y cargador");
    await expect(prizes).toContainText(
      "Juntá 2 medallas y entrás al sorteo de Tablet",
    );
    await expect(prizes.locator("img")).toHaveAttribute("src", /raffle-images/);
    await expect(prizes).not.toContainText("Viaje");
  });

  await test.step("scanning says how many are missing, with the cup on the bar", async () => {
    await page.goto(`${seed.origin}/s/${cafe.id}`);
    await signInByMail(page, seed.visitorEmail);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
    await expect(
      page.getByText("Te falta 1 para el sorteo de Tablet"),
    ).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: "Medallas juntadas" }),
    ).toHaveAttribute("aria-valuetext", "1 de 2 medallas");
  });

  await test.step("Mis medallas keeps the ladder", async () => {
    await page.goto(`${seed.origin}/mis-medallas`);
    const prizes = page.getByRole("region", { name: "Premios" });
    await expect(prizes).toContainText("Próximo");
    await expect(prizes).toContainText("Te falta 1 para el sorteo de Tablet");
  });
});

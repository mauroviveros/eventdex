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

test("staff draws, voids and publishes; the visitor sees the winner", async ({
  page,
  browser,
}) => {
  const [cafe] = seed.spots;
  if (!cafe) throw new Error("seed without spots");

  await test.step("no winners are public yet", async () => {
    await page.goto(`${seed.origin}/sorteo`);
    await expect(
      page.getByRole("heading", { name: "Todavía no hay ganadores" }),
    ).toBeVisible();
  });

  await test.step("a visitor collects a medal", async () => {
    await page.goto(`${seed.origin}/s/${cafe.id}`);
    await signInByMail(page, seed.visitorEmail);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
  });

  const staff = await browser.newPage();

  await test.step("the event leads to a raffle page, empty at first", async () => {
    await staff.goto(
      `http://app.localhost:3000/${seed.org.slug}/eventos/${seed.event.slug}`,
    );
    await signInByMail(staff, seed.ownerEmail);
    await staff.getByRole("link", { name: "Sorteo", exact: true }).click();
    await expect(
      staff.getByText("Todavía no hay sorteos", { exact: true }),
    ).toBeVisible();
  });

  await test.step("a raffle that asks too much says nobody can win it", async () => {
    await staff.getByLabel("Medallas para participar").fill("5");
    const raffle = await createRaffle(staff, "Viaje");
    await expect(raffle).toContainText("nadie para sortear");
    await expect(
      raffle.getByRole("button", { name: "Sacar ganador" }),
    ).toHaveCount(0);
  });

  await test.step("a draw can be voided, with a reason, and is not erased", async () => {
    const raffle = await createRaffle(staff, "Bicicleta");
    await expect(raffle).toContainText("1 participante para sortear");
    await raffle.getByRole("button", { name: "Sacar ganador" }).click();
    await expect(raffle).toContainText(seed.visitorEmail);
    await expect(raffle).toContainText("nadie para sortear");

    await raffle.getByText("Anular", { exact: true }).click();
    await raffle.getByRole("button", { name: "Anular extracción" }).click();
    await expect(raffle).toContainText("Contá por qué se anula.");
    await raffle.getByLabel("Motivo").fill("No se presentó");
    await raffle.getByRole("button", { name: "Anular extracción" }).click();
    await expect(raffle).toContainText("Anulada");
    await expect(raffle).toContainText("No se presentó");
    await expect(raffle).toContainText(seed.visitorEmail);
    await expect(
      raffle.getByRole("button", { name: "Publicar ganadores" }),
    ).toHaveCount(0);
  });

  await test.step("the winner of another raffle is published", async () => {
    const raffle = await createRaffle(staff, "Remera");
    await raffle.getByRole("button", { name: "Sacar ganador" }).click();
    await expect(raffle).toContainText(seed.visitorEmail);
    await raffle.getByRole("button", { name: "Publicar ganadores" }).click();
    await raffle.getByRole("button", { name: "Sí, publicar" }).click();
    await expect(raffle).toContainText("Ganadores publicados");
  });

  await staff.close();

  await test.step("the app links to the winners, never the voided or unpublished", async () => {
    await page.goto(seed.origin);
    await page.getByRole("link", { name: "Ver ganadores del sorteo" }).click();
    await expect(page).toHaveURL(
      `${seed.origin}/sorteo?evento=${seed.event.slug}`,
    );
    await expect(page.getByRole("heading", { name: "Remera" })).toBeVisible();
    await expect(page.getByText("Visitante", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bicicleta" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("heading", { name: "Viaje" })).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(seed.visitorEmail);
  });
});

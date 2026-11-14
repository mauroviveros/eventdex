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

test("the visitor's history grows with each edition they play", async ({
  page,
}) => {
  const [cafe] = seed.spots;
  if (!cafe) throw new Error("seed without spots");

  await test.step("a visitor who hasn't collected yet has no history", async () => {
    await page.goto(`${seed.origin}/mis-medallas`);
    await signInByMail(page, seed.visitorEmail);
    await expect(page).toHaveURL(`${seed.origin}/mis-medallas`);
    await expect(page.getByText("Todavía no tenés historial")).toBeVisible();
  });

  await test.step("with a medal here and an earlier edition, the history lists both", async () => {
    await page.goto(`${seed.origin}/s/${cafe.id}`);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
    await seed.addPastCollection();
    await page.goto(`${seed.origin}/mis-medallas`);

    const history = page.getByRole("region", { name: "Tu historial" });
    await expect(history).toContainText("2 eventos · 2 medallas");
    await history.getByText("Tu historial").click();
    await expect(history).toContainText(
      "Jugaste 2 eventos, juntaste 2 medallas y ganaste 0 sorteos.",
    );
    await expect(history.getByText("Feria E2E · Abril")).toBeVisible();
  });

  await test.step("the stamps earned are filled and the rest say how to earn them", async () => {
    const stamps = page.getByRole("list", { name: "Tus sellos" });
    // The earlier edition was the first of a series that went on.
    await expect(stamps).toContainText("Estuviste en la primera edición");
    await expect(stamps).toContainText(
      "Venir a tres ediciones seguidas del mismo evento.",
    );
    await expect(stamps).toContainText("Ganar un sorteo.");
  });
});

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

test("the team gets a role badge and the way to the raffle; a visitor does not", async ({
  page,
  browser,
}) => {
  await test.step("the owner sees the badge and 'Ir al sorteo' in their menu", async () => {
    await page.goto(`${seed.origin}/mis-medallas`);
    await signInByMail(page, seed.ownerEmail);
    await expect(page).toHaveURL(`${seed.origin}/mis-medallas`);

    const profile = page.getByRole("region", { name: "Tu perfil" });
    await expect(profile).toContainText("Dueño");

    await page.locator("header summary").click();
    const raffle = page.getByRole("link", { name: "Ir al sorteo" });
    await expect(raffle).toHaveAttribute(
      "href",
      new RegExp(
        `/panel/${seed.org.slug}/eventos/${seed.event.slug}\\?tab=sorteo$`,
      ),
    );
  });

  await test.step("a visitor has no badge and no link to the raffle", async () => {
    const visitor = await browser.newContext();
    const tab = await visitor.newPage();
    await tab.goto(`${seed.origin}/mis-medallas`);
    await signInByMail(tab, seed.visitorEmail);
    await expect(tab.getByRole("region", { name: "Tu perfil" })).toBeVisible();
    await expect(tab.getByText("Dueño")).toBeHidden();
    await expect(tab.getByText("Equipo", { exact: true })).toBeHidden();
    await tab.locator("header summary").click();
    await expect(tab.getByRole("link", { name: "Mis medallas" })).toBeVisible();
    await expect(tab.getByRole("link", { name: "Ir al sorteo" })).toBeHidden();
    await visitor.close();
  });
});

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

test("on a desktop, a table sorts from its headers, through the URL", async ({
  page,
}) => {
  await page.goto(
    `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}?tab=spots`,
  );
  await signInByMail(page, seed.ownerEmail);

  // The phone's picker gives way to the headers.
  await expect(page.getByLabel("Ordenar por")).toBeHidden();
  const name = page.getByRole("columnheader", { name: "Spot" });
  await expect(name).toBeVisible();

  await name.getByRole("link").click();
  await expect(page).toHaveURL(/orden=nombre&dir=asc/);
  await expect(name).toHaveAttribute("aria-sort", "ascending");

  await name.getByRole("link").click();
  await expect(page).toHaveURL(/orden=nombre&dir=desc/);
  await expect(name).toHaveAttribute("aria-sort", "descending");
});

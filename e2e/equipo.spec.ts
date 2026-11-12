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

// A 1×1 PNG: all the upload needs.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test("the owner runs the team and the brand shows on the public app", async ({
  page,
  browser,
}) => {
  await page.goto(`http://localhost:3000/panel/${seed.org.slug}/ajustes`);
  await signInByMail(page, seed.ownerEmail);
  await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible();

  const visitor = await browser.newPage();
  await visitor.goto(seed.origin);
  await visitor.locator("header").first().waitFor();

  await test.step("a new color reaches the public app right away", async () => {
    await page.getByLabel("Color de marca").fill("#d6336c");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Cambios guardados.")).toBeVisible();

    const ramp = () =>
      visitor
        .locator(".ramp-scope")
        .first()
        .evaluate((el) =>
          (el as HTMLElement).style.getPropertyValue("--ramp-3"),
        );
    await visitor.reload();
    expect(await ramp()).not.toContain(" 125");
  });

  await test.step("a logo replaces the initials, and can be removed", async () => {
    await page.getByLabel("Logo").setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await page.getByRole("button", { name: "Subir logo" }).click();
    await expect(page.getByText("Logo actualizado.")).toBeVisible();
    await visitor.reload();
    await expect(visitor.locator("header img.logo")).toBeVisible();

    await page.getByRole("button", { name: "Quitar logo" }).click();
    await page.getByRole("button", { name: "Sí, quitar" }).click();
    // The confirm button renames itself while pending: the preview is the signal.
    await expect(page.locator("figure img.logo")).toHaveCount(0);
    await visitor.reload();
    await expect(visitor.locator("header img.logo")).toHaveCount(0);
  });

  await test.step("the owner sees the domains but cannot change them", async () => {
    await expect(page.getByText("Principal: acá apuntan")).toBeVisible();
    await expect(page.getByText("escribinos a")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sumar dominio" }),
    ).toHaveCount(0);
  });

  await test.step("an invitation is listed and revoked", async () => {
    await page.goto(`http://localhost:3000/panel/${seed.org.slug}/equipo`);
    const email = `nueva-${seed.org.slug}@e2e.local`;
    await page.getByLabel("Mail").fill(email);
    await page.getByRole("button", { name: "Invitar", exact: true }).click();
    await expect(page.getByText(email)).toBeVisible();

    await page
      .getByRole("button", { name: `Revocar la invitación de ${email}` })
      .click();
    await expect(page.getByText(email)).toBeHidden();
  });

  await test.step("an invited person joins, changes role and is removed", async () => {
    const email = seed.visitorEmail;
    await page.getByLabel("Mail").fill(email);
    await page.getByRole("button", { name: "Invitar", exact: true }).click();
    await expect(page.getByText(email)).toBeVisible();

    await visitor.goto("http://localhost:3000/panel");
    await signInByMail(visitor, email);
    await expect(visitor).toHaveURL(new RegExp(`/${seed.org.slug}$`));
    await expect(visitor.getByRole("link", { name: "Equipo" })).toHaveCount(0);
    const denied = await visitor.goto(
      `http://localhost:3000/panel/${seed.org.slug}/equipo`,
    );
    expect(denied?.status()).toBe(404);

    await page.reload();
    await page.getByRole("button", { name: `Hacer owner a ${email}` }).click();
    await page
      .getByRole("button", { name: `Pasar a staff a ${email}` })
      .waitFor();
    await page
      .getByRole("button", { name: `Pasar a staff a ${email}` })
      .click();
    await page
      .getByRole("button", { name: `Hacer owner a ${email}` })
      .waitFor();

    await page.getByRole("button", { name: `Quitar a ${email}` }).click();
    await page.getByRole("button", { name: "Sí, quitar" }).click();
    await expect(
      page.getByRole("listitem").filter({ hasText: email }),
    ).toHaveCount(0);
  });

  await visitor.close();
});

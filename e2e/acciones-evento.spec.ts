import { expect, test } from "@playwright/test";
import { signInByMail } from "./support/mailpit";
import { seedLiveEvent } from "./support/seed";

let seed: Awaited<ReturnType<typeof seedLiveEvent>>;

test.beforeAll(async () => {
  seed = await seedLiveEvent();
  await seed.addDraft();
  await seed.addDraft("Feria General");
});

test.afterAll(async () => {
  await seed?.cleanup();
});

test("the event's General asks before publishing, and publishes", async ({
  page,
}) => {
  await page.goto(
    `http://localhost:3000/panel/${seed.org.slug}/eventos/feria-general`,
  );
  await signInByMail(page, seed.ownerEmail);
  const publish = page
    .getByRole("region", { name: "Publicación" })
    .getByRole("button", { name: "Publicar" });
  const confirm = page.getByRole("alertdialog", {
    name: "Publicar Feria General",
  });

  await test.step("cancelling leaves it a draft, the focus on Publicar", async () => {
    await publish.click();
    await expect(
      confirm.getByRole("button", { name: "Cancelar" }),
    ).toBeFocused();
    await confirm.getByRole("button", { name: "Cancelar" }).click();
    await expect(publish).toBeFocused();
  });

  await test.step("confirming publishes it, says so, and keeps the focus on the page", async () => {
    await publish.click();
    await confirm.getByRole("button", { name: "Sí, publicar" }).click();
    // The section goes away with the draft; the toast still comes.
    await expect(page.getByText("Feria General está publicado.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Publicación" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  });
});

test("a ready draft is published from its row's menu, after confirming", async ({
  page,
}) => {
  await page.goto(`http://localhost:3000/panel/${seed.org.slug}`);
  await signInByMail(page, seed.ownerEmail);
  const card = page
    .getByRole("table", { name: "Eventos" })
    .getByRole("row")
    .filter({ hasText: "Feria Borrador" });
  const menu = page.getByRole("button", { name: "Acciones de Feria Borrador" });

  await test.step("cancelling leaves it a draft, and the focus back on ⋮", async () => {
    await menu.click();
    await page.getByRole("menuitem", { name: "Publicar" }).click();
    const confirm = page.getByRole("alertdialog", {
      name: "Publicar Feria Borrador",
    });
    await expect(
      confirm.getByRole("button", { name: "Cancelar" }),
    ).toBeFocused();
    await confirm.getByRole("button", { name: "Cancelar" }).click();
    await expect(menu).toBeFocused();
    await expect(card.getByText("Borrador", { exact: true })).toBeVisible();
  });

  await test.step("confirming publishes it, and the menu offers the public page", async () => {
    await menu.click();
    await page.getByRole("menuitem", { name: "Publicar" }).click();
    await page.getByRole("button", { name: "Sí, publicar" }).click();
    await expect(
      page.getByText("Feria Borrador está publicado."),
    ).toBeVisible();
    await expect(card.getByText("Próximo", { exact: true })).toBeVisible();

    await menu.click();
    await expect(
      page.getByRole("menuitem", { name: /Ver en el sitio/ }),
    ).toHaveAttribute("href", `${seed.origin}/eventos/feria-borrador`);
    await expect(page.getByRole("menuitem", { name: "Publicar" })).toHaveCount(
      0,
    );
  });
});

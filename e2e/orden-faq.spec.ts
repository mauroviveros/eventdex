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

const FIRST = "¿Hay estacionamiento?";
const SECOND = "¿Cuánto cuesta?";

test("moving a question in Página reorders it on the public page", async ({
  page,
  browser,
}) => {
  await page.goto(
    `http://localhost:3000/panel/${seed.org.slug}/eventos/feria?tab=pagina`,
  );
  await signInByMail(page, seed.ownerEmail);
  const faqs = page.getByRole("region", { name: "Preguntas frecuentes" });
  const list = faqs.getByRole("list").first();
  const add = faqs.locator("form").filter({
    has: page.getByRole("button", { name: "Agregar pregunta" }),
  });

  await test.step("a new question goes to the end", async () => {
    for (const question of [FIRST, SECOND]) {
      await add.getByLabel("Pregunta", { exact: true }).fill(question);
      await add.getByLabel("Respuesta").fill("Sí.");
      await add.getByRole("button", { name: "Agregar pregunta" }).click();
      await expect(list.getByText(question)).toBeVisible();
    }
    await expect(list.getByRole("listitem")).toContainText([FIRST, SECOND]);
  });

  await test.step("the first has no ▲ and the last has no ▼", async () => {
    await expect(
      faqs.getByRole("button", { name: `Subir «${FIRST}»` }),
    ).toHaveCount(0);
    await expect(
      faqs.getByRole("button", { name: `Bajar «${SECOND}»` }),
    ).toHaveCount(0);
  });

  await test.step("moving the last one up puts it first, and it stays", async () => {
    await faqs.getByRole("button", { name: `Subir «${SECOND}»` }).click();
    await expect(list.getByRole("listitem")).toContainText([SECOND, FIRST]);
    // The focus follows the question that moved.
    await expect(
      faqs.getByRole("button", { name: `Bajar «${SECOND}»` }),
    ).toBeFocused();

    await page.reload();
    await expect(list.getByRole("listitem")).toContainText([SECOND, FIRST]);
  });

  await test.step("the public page shows them in the new order", async () => {
    const visitor = await browser.newPage();
    await visitor.goto(`${seed.origin}/eventos/feria`);
    await expect(
      visitor
        .getByRole("region", { name: "Preguntas frecuentes" })
        .locator("summary"),
    ).toHaveText([SECOND, FIRST]);
  });
});

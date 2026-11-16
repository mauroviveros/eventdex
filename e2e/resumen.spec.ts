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

test.setTimeout(60_000);

test("the overview: a published event opens on Resumen and fills in with each medal", async ({
  page,
  browser,
}) => {
  const [one] = seed.spots;
  if (!one) throw new Error("seed without spots");
  const staff = await browser.newPage();
  const event = `http://localhost:3000/panel/${seed.org.slug}/eventos/${seed.event.slug}`;

  await test.step("a published event opens on Resumen, empty before any medal", async () => {
    await staff.goto(event);
    await signInByMail(staff, seed.ownerEmail);
    await expect(
      staff.getByRole("tab", { name: "Resumen", selected: true }),
    ).toBeVisible();
    await expect(staff.getByText("Todavía no hay medallas")).toBeVisible();
  });

  await test.step("a visitor's first medal", async () => {
    await page.goto(`${seed.origin}/s/${one.id}`);
    await signInByMail(page, seed.visitorEmail);
    await expect(
      page.getByRole("heading", { name: "¡Medalla nueva!" }),
    ).toBeVisible();
  });

  await test.step("the overview counts it, warns there is little data and tells it", async () => {
    await staff.reload();
    await expect(staff.locator("dl").first()).toContainText("Visitantes1");
    await expect(staff.getByText(/^Pocos datos todavía/)).toBeVisible();
    await expect(
      staff.getByRole("region", { name: "Actividad" }),
    ).toContainText("llegó: primera medalla en");
    await expect(
      staff.getByRole("region", { name: "Hasta dónde llegan" }),
    ).toContainText("Registrados");
  });

  await test.step("the org's Resumen leads with the event and links to the whole activity", async () => {
    await staff.goto(`http://localhost:3000/panel/${seed.org.slug}`);
    await expect(
      staff.getByRole("region", { name: "Feria E2E" }),
    ).toContainText("Visitantes1");
    await expect(staff.getByRole("region", { name: "Público" })).toContainText(
      "Visitantes únicos1",
    );
    await expect(
      staff.getByRole("region", { name: "Actividad" }),
    ).toContainText("Feria E2E");
    await staff.getByRole("link", { name: "Ver toda la actividad" }).click();
    await expect(
      staff.getByRole("heading", { level: 1, name: "Actividad" }),
    ).toBeVisible();
    await expect(staff.getByText(/llegó: primera medalla en/)).toBeVisible();
  });

  await test.step("the activity filters by kind, and says when nothing matches", async () => {
    await staff.getByRole("link", { name: "Sorteos" }).click();
    await expect(staff).toHaveURL(/tipo=sorteo/);
    await expect(staff.getByText("Nada con estos filtros")).toBeVisible();
  });
});

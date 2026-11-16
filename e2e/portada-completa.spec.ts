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

const ABOUT = "Dos jornadas de stands y talleres para toda la familia.";
const TICKETS = "https://tickets.example/feria";
const QUESTION = "¿Hay estacionamiento?";
const ANSWER = "Sí, un playón gratuito frente a la entrada.";
const CAPTION = "La entrada del predio";

test("what the staff loads in Página shows on the event's public page", async ({
  page,
  browser,
}) => {
  await page.goto(
    `http://localhost:3000/panel/${seed.org.slug}/eventos/feria?tab=pagina`,
  );
  await signInByMail(page, seed.ownerEmail);
  const visitor = await browser.newPage();

  await test.step("the page starts with nothing to show", async () => {
    await expect(page.getByRole("link", { name: "Ver portada" })).toBeVisible();
    await visitor.goto(`${seed.origin}/`);
    await expect(visitor.getByRole("link", { name: /Entradas/ })).toHaveCount(
      0,
    );
    await expect(
      visitor.getByRole("heading", { name: "Preguntas frecuentes" }),
    ).toHaveCount(0);
  });

  await test.step("staff loads the description and the links", async () => {
    const data = page.getByRole("region", { name: "Sobre el evento y links" });
    await data.getByLabel("Sobre el evento").fill(ABOUT);
    await data.getByLabel("Entradas", { exact: true }).fill(TICKETS);
    await data.getByRole("button", { name: "Guardar" }).click();
    await expect(
      page.getByText("Datos de la portada guardados."),
    ).toBeVisible();
    // The page re-renders with what was saved, and the form resets with it
    // when the save ends: wait for that, or the reset wipes the next field typed.
    await expect(data.getByLabel("Sobre el evento")).toHaveValue(ABOUT);
    await expect(data.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });

  await test.step("a link that is not https is refused", async () => {
    const data = page.getByRole("region", { name: "Sobre el evento y links" });
    await data.getByLabel("Sitio web").fill("javascript:alert(1)");
    // Enter, not the button: the last toast still sits over it on a phone.
    await data.getByLabel("Sitio web").press("Enter");
    await expect(
      data.getByText("Pegá un link que empiece con https://"),
    ).toBeVisible();
    await data.getByLabel("Sitio web").fill("");
  });

  await test.step("staff adds a question and a photo", async () => {
    const faqs = page.getByRole("region", { name: "Preguntas frecuentes" });
    await faqs.getByLabel("Pregunta", { exact: true }).fill(QUESTION);
    await faqs.getByLabel("Respuesta").fill(ANSWER);
    await faqs.getByRole("button", { name: "Agregar pregunta" }).click();
    await expect(page.getByText("Pregunta agregada.")).toBeVisible();

    const photos = page.getByRole("region", { name: "Fotos" });
    await photos.locator('input[type="file"]').setInputFiles({
      name: "entrada.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await photos.getByLabel("Epígrafe").fill(CAPTION);
    await photos.getByRole("button", { name: "Subir foto" }).click();
    await expect(page.getByText("Foto agregada.")).toBeVisible();
  });

  await test.step("Ver portada shows what was loaded, in the team's view", async () => {
    // Its own tab, in the same session: the Página tab stays where it is.
    const preview = await page.context().newPage();
    await preview.goto(
      `http://localhost:3000/panel/${seed.org.slug}/eventos/feria/portada`,
    );
    await expect(preview.getByText(ABOUT)).toBeVisible();
    await expect(preview.getByRole("link", { name: /Entradas/ })).toBeVisible();
    await expect(preview.getByText(QUESTION)).toBeVisible();
    await preview.close();
  });

  await test.step("the public page shows it, in the order of a live event", async () => {
    await visitor.reload();
    const tickets = visitor.getByRole("link", { name: /Entradas/ });
    await expect(tickets).toHaveAttribute("href", TICKETS);
    await expect(tickets).toHaveAttribute("target", "_blank");
    await expect(visitor.getByText(ABOUT)).toBeVisible();

    // While it runs, the game comes first; then the event, then the photos.
    const index = visitor.getByRole("navigation", {
      name: "Secciones de la portada",
    });
    await expect(index.getByRole("link")).toHaveText([
      "Juego",
      "El evento",
      "Fotos",
    ]);

    await visitor.getByText(QUESTION).click();
    await expect(visitor.getByText(ANSWER)).toBeVisible();

    // The caption names the figure; the image itself carries no second name.
    const photo = visitor.getByRole("figure", { name: CAPTION }).locator("img");
    const src = await photo.getAttribute("src");
    expect(src).toContain(`/event-photos/${seed.org.id}/`);
    expect((await visitor.request.get(src ?? "")).status()).toBe(200);
  });

  await test.step("past editions list the finished event with its real totals", async () => {
    // A finished edition where the visitor collected one medal: the visitor
    // has to exist, and signing in creates them.
    await visitor.goto(`${seed.origin}/mis-medallas`);
    await signInByMail(visitor, seed.visitorEmail);
    await seed.addPastCollection();
    await visitor.goto(`${seed.origin}/`);
    const past = visitor.getByRole("region", { name: "Ediciones anteriores" });
    // Figures only: the org has one page, so an edition links nowhere.
    const edition = past.getByRole("listitem").filter({ hasText: "Abril" });
    await expect(edition).toContainText("Feria E2E · Abril");
    await expect(edition).toContainText("1 visitante · 1 medalla");
    await expect(past.getByRole("link")).toHaveCount(0);
  });

  await test.step("removing the photo takes it off the page", async () => {
    await page.getByRole("button", { name: /Quitar la foto/ }).click();
    await page.getByRole("button", { name: "Sí, quitar" }).click();
    await expect(page.getByText("Todavía no hay fotos")).toBeVisible();
    await visitor.reload();
    await expect(visitor.getByRole("figure", { name: CAPTION })).toHaveCount(0);
  });
});

import { expect, test } from "@playwright/test";
import { seedLiveEvent } from "./support/seed";

let seed: Awaited<ReturnType<typeof seedLiveEvent>>;

const LONG =
  "El taller de cerámica armó una mesa larga para que cada visitante se lleve su pieza; la última hornada se agotó.";
const CAPTIONS = ["El patio a la apertura", LONG, "Panorámica del pabellón"];

test.beforeAll(async () => {
  seed = await seedLiveEvent();
  await seed.addPhotos(CAPTIONS);
});

test.afterAll(async () => {
  await seed?.cleanup();
});

test("a photo opens whole and the gallery is walked from the dialog", async ({
  page,
}) => {
  await page.goto(seed.origin);
  const first = page.getByRole("button", { name: /^Ampliar foto 1 de 3/ });
  await first.click();

  const viewer = page.getByRole("dialog");
  await test.step("it opens on the photo with its caption and place", async () => {
    await expect(viewer).toContainText(CAPTIONS[0] ?? "");
    await expect(viewer).toContainText("1 de 3");
    await expect(
      viewer.getByRole("button", { name: "Foto anterior" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  await test.step("the arrow keys walk it, and a long caption reads whole", async () => {
    await page.keyboard.press("ArrowRight");
    await expect(viewer).toContainText("2 de 3");
    await expect(viewer.getByRole("heading", { name: LONG })).toBeVisible();
    await viewer.getByRole("button", { name: "Foto siguiente" }).click();
    await expect(viewer).toContainText("3 de 3");
    await expect(
      viewer.getByRole("button", { name: "Foto siguiente" }),
    ).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(viewer).toContainText("2 de 3");
  });

  await test.step("Escape closes it and the focus goes back to the photo it ended on", async () => {
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(
      page.getByRole("button", { name: /^Ampliar foto 2 de 3/ }),
    ).toBeFocused();
  });
});

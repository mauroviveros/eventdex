import { expect, type Page } from "@playwright/test";

const MAILPIT = "http://127.0.0.1:54424/api/v1";

/** The sign-in link of the latest mail to `email`, waiting for it to arrive. */
export async function magicLink(email: string) {
  let link = "";
  await expect
    .poll(
      async () => {
        const search = await fetch(
          `${MAILPIT}/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`,
        ).then((r) => r.json());
        const id = search.messages?.[0]?.ID;
        if (!id) return "";
        const message = await fetch(`${MAILPIT}/message/${id}`).then((r) =>
          r.json(),
        );
        link = message.Text.match(/https?:\/\/\S+\/verify\S+/)?.[0] ?? "";
        return link;
      },
      { message: `sign-in mail to ${email}`, timeout: 15_000 },
    )
    .not.toBe("");
  return link;
}

/** Signs in with the dev mail link on the page's form (/ingresar, or /s/[id] without a session). */
export async function signInByMail(page: Page, email: string) {
  await page.getByLabel("Mail").fill(email);
  await page.getByRole("button", { name: "Mandarme el link" }).click();
  await expect(page.getByRole("status")).toContainText(email);
  await page.goto(await magicLink(email));
}

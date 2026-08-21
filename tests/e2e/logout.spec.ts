import { expect, test } from "@playwright/test";
import { createVerifiedUser, signIn } from "./fixtures/mail";
test("logout is idempotent and isolated to the presented browser context", async ({
  browser,
  page,
}) => {
  const user = await createVerifiedUser(page);
  const first = await browser.newContext();
  const second = await browser.newContext();
  const firstPage = await first.newPage();
  const secondPage = await second.newPage();
  await signIn(firstPage, user);
  await signIn(secondPage, user);
  await firstPage.getByRole("button", { name: "Sign out" }).click();
  await expect(firstPage).toHaveURL(/login/);
  await secondPage.reload();
  await expect(secondPage).toHaveURL(/dashboard/);
  await first.close();
  await second.close();
});

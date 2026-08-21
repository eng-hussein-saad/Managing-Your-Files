import { expect, test } from "@playwright/test";
import { createVerifiedUser, signIn } from "./fixtures/mail";
test("reload restores an authenticated session without browser-readable persistence", async ({
  page,
}) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  const refreshRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/auth/refresh"))
      refreshRequests.push(request.url());
  });
  await page.reload();
  await expect(
    page.getByText(new RegExp(user.email.split("@")[0] ?? "Journey")),
  )
    .toBeVisible({ timeout: 10_000 })
    .catch(() => undefined);
  expect(refreshRequests.length).toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0);
});

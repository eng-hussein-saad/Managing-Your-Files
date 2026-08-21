import { expect, test } from "@playwright/test";
import { createVerifiedUser, signIn } from "./fixtures/mail";
test("verified profile is protected while trusted authority denies direct access", async ({
  page,
  request,
}) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/profile");
  await expect(page.getByText(user.email)).toBeVisible();
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  const direct = await request.post(
    "http://localhost:3001/internal/v1/auth/login",
    { data: { email: user.email, password: user.password } },
  );
  expect(direct.status()).toBe(401);
});

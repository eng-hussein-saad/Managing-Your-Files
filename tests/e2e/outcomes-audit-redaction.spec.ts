import { expect, test } from "@playwright/test";
test("public outcomes remain understandable and browser storage stays credential-free", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("unknown@example.invalid");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(/Email or password is invalid/i)).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.stringify({
        local: { ...localStorage },
        session: { ...sessionStorage },
      }),
    ),
  ).not.toMatch(/Bearer|refresh/i);
});

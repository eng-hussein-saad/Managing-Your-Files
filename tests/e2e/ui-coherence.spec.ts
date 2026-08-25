import { createVerifiedUser, signIn } from "./fixtures/mail";
import { expect, test } from "./fixtures/ui-acceptance";

/** Confirms the visible route uses only the current product identity. */
async function expectFileoraIdentity(page: import("@playwright/test").Page) {
  await expect(page.getByText("Gold Era", { exact: false })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Fileora/ }).first(),
  ).toBeVisible();
}

test("public and user routes present one coherent Fileora product", async ({
  page,
}) => {
  for (const route of ["/", "/login", "/register", "/verify-email"]) {
    await page.goto(route);
    await expectFileoraIdentity(page);
  }
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  for (const route of ["/dashboard", "/files", "/profile"]) {
    await page.goto(route);
    await expectFileoraIdentity(page);
  }
});

test("administrator routes retain restricted Fileora identity", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin-baseline@example.invalid");
  await page.getByLabel("Password").fill("BaselinePassword123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  for (const route of [
    "/admin",
    "/admin/users",
    "/admin/files",
    "/admin/audit",
  ]) {
    await page.goto(route);
    await expectFileoraIdentity(page);
  }
});

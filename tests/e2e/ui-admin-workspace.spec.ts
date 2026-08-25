import {
  expect,
  expectNoConsoleErrors,
  expectNoPageOverflow,
  test,
} from "./fixtures/ui-acceptance";

const admin = {
  email: "admin-baseline@example.invalid",
  password: "BaselinePassword123!",
};

/** Signs into the deterministic restricted administrator fixture. */
async function signInAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password").fill(admin.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/admin/);
}

test("restricted administrator routes remain responsive and metadata-only", async ({
  page,
  consoleErrors,
}, testInfo) => {
  await signInAdmin(page);
  for (const route of [
    "/admin",
    "/admin/users",
    "/admin/files",
    "/admin/audit",
  ]) {
    await page.goto(route);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole("main")).toBeVisible();
      await expectNoPageOverflow(page);
      await testInfo.attach(`${route.replaceAll("/", "-")}-${width}`, {
        body: await page.screenshot({ fullPage: true, animations: "disabled" }),
        contentType: "image/png",
      });
    }
  }
  await page.goto("/admin/files");
  await expect(
    page.getByRole("button", { name: /preview|download/i }),
  ).toHaveCount(0);
  expectNoConsoleErrors(consoleErrors);
});

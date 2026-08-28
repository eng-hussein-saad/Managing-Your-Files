import {
  expect,
  expectNoConsoleErrors,
  expectNoPageOverflow,
  test,
} from "./fixtures/ui-acceptance";
import { signInAdministrator } from "./fixtures/admin";

test("restricted administrator routes remain responsive and metadata-only", async ({
  page,
  consoleErrors,
}, testInfo) => {
  await signInAdministrator(page);
  for (const route of [
    "/admin",
    "/admin/users",
    "/admin/files",
    "/admin/audit",
  ]) {
    await page.goto(route);
    for (const width of [1440, 768, 390, 360]) {
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

import { createVerifiedUser, signIn } from "./fixtures/mail";
import {
  expect,
  expectNoConsoleErrors,
  expectNoPageOverflow,
  tabTo,
  test,
} from "./fixtures/ui-acceptance";

const checkpoints = [1440, 768, 390, 320] as const;

test("file workspace keeps discovery and upload actions responsive", async ({
  page,
  consoleErrors,
}, testInfo) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/files");
  for (const width of checkpoints) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("heading", { level: 1, name: "My Files" }),
    ).toBeVisible();
    await expect(page.getByLabel("File filters")).toBeVisible();
    await expectNoPageOverflow(page);
    await testInfo.attach(`files-${width}`, {
      body: await page.screenshot({ fullPage: true, animations: "disabled" }),
      contentType: "image/png",
    });
  }
  await tabTo(page, "Select files or drop them here");
  expectNoConsoleErrors(consoleErrors);
});

test("file overlays remain dismissible after viewport changes", async ({
  page,
}) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/files");
  await page.setViewportSize({ width: 768, height: 900 });
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeHidden();
});

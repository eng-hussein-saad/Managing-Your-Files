import { createVerifiedUser, signIn } from "./fixtures/mail";
import {
  expect,
  expectNoConsoleErrors,
  expectNoPageOverflow,
  tabTo,
  test,
} from "./fixtures/ui-acceptance";

const checkpoints = [1440, 768, 390, 320] as const;

test("dashboard and profile retain safe responsive summaries", async ({
  page,
  consoleErrors,
}, testInfo) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  for (const route of ["/dashboard", "/profile"]) {
    await page.goto(route);
    for (const width of checkpoints) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole("main")).toBeVisible();
      await expectNoPageOverflow(page);
      await testInfo.attach(`${route.slice(1)}-${width}`, {
        body: await page.screenshot({ fullPage: true, animations: "disabled" }),
        contentType: "image/png",
      });
    }
  }
  await page.goto("/dashboard");
  await tabTo(page, "Open your files");
  expectNoConsoleErrors(consoleErrors);
});

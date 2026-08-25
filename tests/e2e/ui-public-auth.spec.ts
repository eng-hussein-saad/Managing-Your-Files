import { createVerifiedUser, signIn } from "./fixtures/mail";
import {
  expect,
  expectNoConsoleErrors,
  expectNoPageOverflow,
  tabTo,
  test,
} from "./fixtures/ui-acceptance";

const checkpoints = [1440, 768, 390] as const;
const themes = ["light", "dark"] as const;

test("landing and authentication surfaces retain approved responsive semantics", async ({ page, consoleErrors }, testInfo) => {
  for (const theme of themes) {
    await page.goto("/");
    await page.evaluate(
      /** Persists the requested screenshot theme. */ (preference) => localStorage.setItem("fileora:theme", preference),
      theme,
    );
    for (const width of checkpoints) {
      await page.setViewportSize({ width, height: 900 });
      await page.reload();
      await expect(page.getByRole("heading", { level: 1, name: "Order for every file." })).toBeVisible();
      await expect(page.getByRole("link", { name: "Create your account" })).toBeVisible();
      await testInfo.attach(`landing-${width}-${theme}`, {
        body: await page.screenshot({ fullPage: true, animations: "disabled" }),
        contentType: "image/png",
      });
    }
  }
  await expectNoPageOverflow(page);
  await page.goto("/");
  await tabTo(page, "Create your account");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  for (const route of ["/register", "/login", "/verify-email"]) {
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    await expectNoPageOverflow(page);
  }
  expectNoConsoleErrors(consoleErrors);
});

test("session failure redirects safely and verified sign-out returns to public entry", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
  await expect(page.getByText(/session|sign in/i).first()).toBeVisible();
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/login|\/$/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

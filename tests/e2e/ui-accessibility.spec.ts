import {
  expectNoAccessibilityViolations,
  scanAccessibility,
  test,
} from "./fixtures/ui-acceptance";
import { createVerifiedUser, signIn } from "./fixtures/mail";
import { signInAdministrator } from "./fixtures/admin";

test("public and authenticated route families have no automated WCAG A/AA violations", async ({ page }) => {
  for (const route of ["/", "/login", "/register", "/verify-email"]) {
    await page.goto(route);
    expectNoAccessibilityViolations(await scanAccessibility(page));
  }
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  for (const route of ["/dashboard", "/files", "/profile"]) {
    await page.goto(route);
    expectNoAccessibilityViolations(await scanAccessibility(page));
  }
});

test("administrator route family has no automated WCAG A/AA violations", async ({ page }) => {
  await signInAdministrator(page);
  for (const route of ["/admin", "/admin/users", "/admin/files", "/admin/audit"]) {
    await page.goto(route);
    expectNoAccessibilityViolations(await scanAccessibility(page));
  }
});

import {
  expectNoAccessibilityViolations,
  scanAccessibility,
  test,
} from "./fixtures/ui-acceptance";
import { createVerifiedUser, signIn } from "./fixtures/mail";

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
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin-baseline@example.invalid");
  await page.getByLabel("Password").fill("BaselinePassword123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  for (const route of ["/admin", "/admin/users", "/admin/files", "/admin/audit"]) {
    await page.goto(route);
    expectNoAccessibilityViolations(await scanAccessibility(page));
  }
});

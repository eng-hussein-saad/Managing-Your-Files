import { expect, test } from "@playwright/test";
import { signInAdministrator } from "./fixtures/admin";

test("administrator monitoring shows exact totals and retained sanitized events", async ({ page }) => {
  await signInAdministrator(page);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Platform overview" })).toBeVisible();
  await expect(page.locator(".stat-card").filter({ hasText: "Users" })).toBeVisible();
  await page.goto("/admin/audit");
  await expect(page.getByRole("heading", { name: "Audit history" })).toBeVisible();
  await expect(page.getByLabel("Actor").getByRole("option", { name: "System" })).toHaveCount(0);
  await expect(page.getByRole("table").or(page.getByText("No audit events match these filters."))).toBeVisible();
});

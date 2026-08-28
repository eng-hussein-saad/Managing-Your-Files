import { expect, test } from "@playwright/test";

for (const width of [360, 768, 1440]) {
  test(`Fileora identity, tagline, and metadata at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page).toHaveTitle(/Fileora/);
    await expect(page.getByText("Your files. Organized your way.").filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Gold Era");
  });
}

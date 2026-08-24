import { expect, test } from "@playwright/test";

test("light, dark, and system selections persist without post-load correction", async ({ page }) => {
  await page.goto("/");
  const selector = page.getByLabel("Theme").first();
  for (const theme of ["light", "dark"] as const) {
    await selector.selectOption(theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  }
  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByLabel("Theme").first().selectOption("system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

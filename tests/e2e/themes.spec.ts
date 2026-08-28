import { expect, test } from "@playwright/test";

test("light, dark, and system selections persist without post-load correction", async ({ page }) => {
  await page.goto("/");
  for (const theme of ["light", "dark"] as const) {
    await page.getByRole("button", { name: /^Appearance:/ }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  }
  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("button", { name: /^Appearance:/ }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

import { expect, test } from "@playwright/test";
import { signInAdministrator } from "./fixtures/admin";
import { createVerifiedUser } from "./fixtures/mail";

test("administrator searches, confirms role changes, and permanently deletes a target by keyboard", async ({ browser, page }) => {
  const targetContext = await browser.newContext();
  const targetPage = await targetContext.newPage();
  const target = await createVerifiedUser(targetPage);
  await targetContext.close();
  await signInAdministrator(page);
  await page.goto("/admin/users");
  await page.getByLabel("Search users").fill(target.email);
  const targetRow = page.getByRole("row").filter({ hasText: target.email });
  await expect(targetRow).toBeVisible();
  await targetRow.getByRole("button", { name: "Change role" }).press("Enter");
  await page.getByRole("button", { name: "Confirm" }).press("Enter");
  await expect(page.getByText("User role updated.")).toBeVisible();
  await targetRow.getByRole("button", { name: "Delete" }).press("Enter");
  await page.getByRole("textbox", { name: new RegExp(target.email) }).fill(target.email);
  await page.getByRole("button", { name: "Confirm" }).press("Enter");
  await expect(page.getByText("User permanently deleted.")).toBeVisible();
});

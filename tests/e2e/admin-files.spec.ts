import { expect, test } from "@playwright/test";
import { signInAdministrator } from "./fixtures/admin";
import { browserTextFile } from "./fixtures/files";
import { createVerifiedUser, signIn } from "./fixtures/mail";

test("administrator filters metadata and deletes without content capability", async ({ browser, page }) => {
  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const owner = await createVerifiedUser(ownerPage);
  await signIn(ownerPage, owner);
  await ownerPage.goto("/files");
  await ownerPage.getByLabel(/select files/i).setInputFiles(browserTextFile("admin-journey.txt", 24));
  await ownerPage.getByRole("button", { name: /upload queued files/i }).click();
  await expect(ownerPage.getByText(/admin-journey.txt: success/i)).toBeVisible();
  await ownerContext.close();
  await signInAdministrator(page);
  await page.goto("/admin/files");
  await page.getByLabel("Search files").fill("admin-journey");
  const targetRow = page.getByRole("row").filter({ hasText: owner.email });
  await expect(targetRow).toBeVisible();
  await expect(page.getByRole("link", { name: /preview|download/i })).toHaveCount(0);
  await targetRow.getByRole("button", { name: "Delete permanently" }).click();
  await page.getByRole("textbox", { name: /admin-journey.txt/ }).fill("admin-journey.txt");
  await page.getByRole("dialog").getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByText("File permanently deleted.")).toBeVisible();
});

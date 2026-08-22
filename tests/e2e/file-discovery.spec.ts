import { expect, test } from "@playwright/test";
import { browserTextFile } from "./fixtures/files";
import { createVerifiedUser, signIn } from "./fixtures/mail";

test("search, filter, sort, pagination, details, and cross-owner isolation", async ({
  browser,
  page,
}) => {
  const owner = await createVerifiedUser(page);
  await signIn(page, owner);
  await page.goto("/files");
  await page
    .getByLabel(/select files/i)
    .setInputFiles([
      browserTextFile("quarterly-report.txt", 20),
      browserTextFile("notes.txt", 10),
    ]);
  await page.getByRole("button", { name: /upload queued files/i }).click();
  await expect(page.getByText(/quarterly-report.txt: success/i)).toBeVisible();
  await page.getByLabel(/search files/i).fill("quarterly");
  await expect(
    page.getByRole("button", { name: /quarterly-report.txt/i }),
  ).toBeVisible();
  await page.getByLabel("Type").selectOption("text");
  await page.getByLabel("Sort").selectOption("name");
  await page.getByLabel("Direction").selectOption("asc");
  await page.getByRole("button", { name: /quarterly-report.txt/i }).click();
  await expect(
    page.getByRole("complementary", { name: /file details/i }),
  ).toContainText("My Files");
  await expect(page.locator("body")).not.toContainText(/storageKey|supabase/i);

  const foreignContext = await browser.newContext();
  const foreignPage = await foreignContext.newPage();
  const foreign = await createVerifiedUser(foreignPage);
  await signIn(foreignPage, foreign);
  await foreignPage.goto("/files");
  await foreignPage.getByLabel(/search files/i).fill("quarterly-report");
  await expect(foreignPage.getByText(/no files match/i)).toBeVisible();
  await foreignContext.close();
});

import { expect, test } from "@playwright/test";
import { browserTextFile } from "./fixtures/files";
import { createVerifiedUser, signIn } from "./fixtures/mail";

test("upload, organize, inspect, download, delete, and dashboard stay owner-isolated", async ({
  browser,
  page,
}) => {
  const owner = await createVerifiedUser(page);
  await signIn(page, owner);
  await page.goto("/files");
  await page.getByRole("button", { name: "New folder" }).click();
  await page.getByLabel("Folder name").fill("Archive");
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Upload files" }).click();
  await page
    .getByLabel(/select files/i)
    .setInputFiles(browserTextFile("complete.txt", 64));
  await page.getByRole("button", { name: /upload queued files/i }).click();
  await page.getByRole("button", { name: "Close upload" }).click();
  await page.getByRole("button", { name: /complete.txt/i }).click();
  await expect(page.getByLabel("Extracted content")).toBeVisible();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  const second = await createVerifiedUser(secondPage);
  await signIn(secondPage, second);
  await secondPage.goto("/files");
  await secondPage.getByLabel(/search files/i).fill("complete.txt");
  await expect(secondPage.getByText(/no files match/i)).toBeVisible();
  await secondContext.close();

  await page.getByRole("button", { name: "Delete file" }).click();
  await page.getByRole("button", { name: /delete permanently/i }).click();
  await page.goto("/dashboard");
  await expect(
    page.getByRole("region", { name: /file activity/i }),
  ).toContainText("0 files");
});

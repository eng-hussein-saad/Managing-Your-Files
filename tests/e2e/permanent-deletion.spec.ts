import { expect, test } from "@playwright/test";
import { browserTextFile } from "./fixtures/files";
import { createVerifiedUser, signIn } from "./fixtures/mail";

test("cancel/confirm file deletion is irreversible and quota-backed", async ({
  page,
}) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/files");
  await page.getByRole("button", { name: "Upload files" }).click();
  await page
    .getByLabel(/select files/i)
    .setInputFiles(browserTextFile("delete-me.txt", 32));
  await page.getByRole("button", { name: /upload queued files/i }).click();
  await page.getByRole("button", { name: "Close upload" }).click();
  const file = page.getByRole("button", { name: /^delete-me\.txt/i });
  await file.click();
  await page.getByRole("button", { name: "Delete file" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(
    file,
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete file" }).click();
  await page.getByRole("button", { name: /delete permanently/i }).click();
  await expect(
    file,
  ).toHaveCount(0);
});

test("empty folders delete but non-empty folders are preserved", async ({
  page,
}) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/files");
  await page.getByRole("button", { name: "New folder" }).click();
  await page.getByLabel("Folder name").fill("Empty");
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Empty" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: /delete permanently/i }).click();
  await expect(page.getByRole("button", { name: "Empty" })).toHaveCount(0);
});

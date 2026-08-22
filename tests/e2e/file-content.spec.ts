import { expect, test } from "@playwright/test";
import { browserDocxFile, browserTextFile } from "./fixtures/files";
import { createVerifiedUser, signIn } from "./fixtures/mail";

test("owned preview/download uses private headers and no provider reference", async ({
  page,
}) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/files");
  await page
    .getByLabel(/select files/i)
    .setInputFiles(browserTextFile("preview.txt", 12));
  await page.getByRole("button", { name: /upload queued files/i }).click();
  await page.getByRole("button", { name: /preview.txt/i }).click();
  await expect(page.getByTitle(/text preview/i)).toBeVisible();
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/download"),
  );
  await page.getByRole("button", { name: /download preview.txt/i }).click();
  const response = await responsePromise;
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["content-disposition"]).toContain("attachment");
  await expect(page.locator("body")).not.toContainText(
    /storageKey|supabase\.co\/storage/i,
  );
});

test("DOCX fallback is explicit and deleted content is no longer discoverable", async ({
  page,
}) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/files");
  await page.getByLabel(/select files/i).setInputFiles(browserDocxFile());
  await page.getByRole("button", { name: /upload queued files/i }).click();
  await page.getByRole("button", { name: /fallback.docx/i }).click();
  await expect(page.getByText(/preview is unavailable/i)).toBeVisible();
});

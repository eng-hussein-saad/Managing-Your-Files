import { expect, test } from "@playwright/test";
import { browserTextFile } from "./fixtures/files";
import { createVerifiedUser, signIn } from "./fixtures/mail";

test("known owned dataset and deletion update current 30-day dashboard aggregates", async ({
  page,
}) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/files");
  await page
    .getByLabel(/select files/i)
    .setInputFiles([
      browserTextFile("one.txt", 10),
      browserTextFile("two.txt", 20),
    ]);
  await page.getByRole("button", { name: /upload queued files/i }).click();
  await page.goto("/dashboard");
  await expect(
    page.getByRole("region", { name: /file activity/i }),
  ).toContainText("2 files");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(31);
  await page.goto("/files");
  await page.getByRole("button", { name: /one.txt/i }).click();
  await page.getByRole("button", { name: "Delete file" }).click();
  await page.getByRole("button", { name: /delete permanently/i }).click();
  await page.goto("/dashboard");
  await expect(
    page.getByRole("region", { name: /file activity/i }),
  ).toContainText("1 files");
});

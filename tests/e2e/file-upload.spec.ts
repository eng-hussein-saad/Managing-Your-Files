import { expect, test } from "@playwright/test";
import {
  browserTextFile,
  exactBoundaryUpload,
  mixedUploadFiles,
  overBoundaryUpload,
} from "./fixtures/files";
import { createVerifiedUser, signIn } from "./fixtures/mail";

/** Opens My Files as a newly verified owner. */
async function openFiles(page: Parameters<typeof createVerifiedUser>[0]) {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/files");
}

test("mixed uploads, exact boundaries, extraction outcomes, quota, and batch limit", async ({
  page,
}) => {
  await openFiles(page);
  const picker = page.getByLabel(/select files/i);
  await picker.setInputFiles(mixedUploadFiles());
  await page.getByRole("button", { name: /upload queued files/i }).click();
  await expect(page.getByRole("list", { name: /upload queue/i })).toContainText(
    "accepted.txt: success",
  );
  await expect(page.getByRole("list", { name: /upload queue/i })).toContainText(
    "rejected.exe: error",
  );

  await picker.setInputFiles(exactBoundaryUpload());
  await page.getByRole("button", { name: /upload queued files/i }).click();
  await expect(page.getByText(/boundary.txt: success/i)).toBeVisible();
  await picker.setInputFiles(overBoundaryUpload());
  await page.getByRole("button", { name: /upload queued files/i }).click();
  await expect(page.getByText(/too-large.txt: error/i)).toBeVisible();

  await picker.setInputFiles(
    Array.from({ length: 11 }, (_value, index) =>
      browserTextFile(`${index}.txt`, 1),
    ),
  );
  await expect(page.getByRole("alert")).toContainText(/no more than 10/i);
});

test("twenty same-owner attempts retain no more than the deterministic quota", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await openFiles(page);
  const picker = page.getByLabel(/select files/i);
  for (let batch = 0; batch < 2; batch += 1) {
    await picker.setInputFiles(
      Array.from({ length: 10 }, (_value, index) =>
        browserTextFile(`quota-${batch}-${index}.txt`, 5_242_880),
      ),
    );
    await page.getByRole("button", { name: /upload queued files/i }).click();
    await expect(
      page.getByRole("list", { name: /upload queue/i }),
    ).not.toContainText("uploading", { timeout: 120_000 });
  }
  await expect(
    page.getByRole("list", { name: /upload queue/i }).getByRole("listitem"),
  ).toHaveCount(20);
  await expect(
    page.getByRole("list", { name: /upload queue/i }),
  ).not.toContainText("error");
});

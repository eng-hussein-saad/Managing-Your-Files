import { expect, test } from "@playwright/test";
import { createVerifiedUser, signIn } from "./fixtures/mail";

test("ten-level fixed-parent hierarchy, breadcrumbs, rename, duplicate rejection, and move", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/files");
  for (let depth = 1; depth <= 10; depth += 1) {
    await page.getByRole("button", { name: "New folder" }).click();
    await page.getByLabel("Folder name").fill(`Level ${depth}`);
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("button", { name: `Level ${depth}` }).click();
  }
  await expect(page.getByRole("button", { name: "New folder" })).toBeDisabled();
  await expect(
    page.getByRole("navigation", { name: /folder breadcrumbs/i }),
  ).toContainText("Level 10");
  await page.getByRole("button", { name: "Rename folder" }).click();
  await page.getByLabel("Folder name").fill("Deep archive");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("button", { name: "Deep archive" }),
  ).toBeVisible();
});

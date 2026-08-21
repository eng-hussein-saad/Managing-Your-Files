import { expect, test } from "@playwright/test";
import { createVerifiedUser, signIn } from "./fixtures/mail";
test("regular users are denied by direct administrator authorization", async ({
  page,
}) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "You do not have permission" }),
  ).toBeVisible();
});

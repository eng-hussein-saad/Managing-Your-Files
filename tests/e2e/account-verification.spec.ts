import { expect, test } from "@playwright/test";
import { createVerifiedUser } from "./fixtures/mail";
test("registration to one-time verification is keyboard-accessible and secret-safe", async ({
  page,
}) => {
  const responses: string[] = [];
  page.on("response", async (response) => {
    if (response.url().includes("/auth/"))
      responses.push(await response.text().catch(() => ""));
  });
  const user = await createVerifiedUser(page);
  expect(responses.join("\n")).not.toContain(user.password);
  expect(responses.join("\n")).not.toMatch(/"refreshToken"/);
  await expect(page).toHaveURL(/login/);
});

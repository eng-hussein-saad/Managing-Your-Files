import { expect, type Page } from "@playwright/test";

/** Polls a local MailHog-compatible API for the latest eight-digit code. */
export async function verificationCode(email: string): Promise<string> {
  const endpoint =
    process.env.E2E_MAIL_API_URL ?? "http://localhost:8025/api/v2/messages";
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(endpoint);
    if (response.ok) {
      const payload = (await response.json()) as {
        items?: Array<{
          Content?: { Headers?: { To?: string[] }; Body?: string };
        }>;
      };
      const message = payload.items?.find((item) =>
        item.Content?.Headers?.To?.some((recipient) =>
          recipient.includes(email),
        ),
      );
      const code = message?.Content?.Body?.match(/\b\d{8}\b/)?.[0];
      if (code) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Verification message was not received");
}
/** Registers and verifies one unique account through the visible journey. */
export async function createVerifiedUser(
  page: Page,
): Promise<{ email: string; password: string }> {
  const email = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.invalid`;
  const password = "correct-password";
  await page.goto("/register");
  await page.getByLabel("Name").fill("Journey User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  const code = await verificationCode(email);
  await page.getByLabel("Eight-digit verification code").fill(code);
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(page.getByText(/Verified/)).toBeVisible();
  return { email, password };
}
/** Signs an existing verified account into one browser context. */
export async function signIn(
  page: Page,
  user: { email: string; password: string },
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/dashboard|admin/);
}

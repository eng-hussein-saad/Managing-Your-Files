import { createVerifiedUser, signIn } from "./fixtures/mail";
import {
  expect,
  expectNoPageOverflow,
  tabTo,
  test,
} from "./fixtures/ui-acceptance";

test("theme, motion, zoom, keyboard targets, and reflow remain inclusive", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /^Appearance: System/ }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await tabTo(page, "Create your account");
  await page.setViewportSize({ width: 640, height: 800 });
  // Halving the CSS viewport below reproduces the reflow boundary produced by 200% browser zoom.
  await expectNoPageOverflow(page);
  const target = page.getByRole("link", { name: "Create your account" });
  const box = await target.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);
});

test("shared overlays contain focus and restore their trigger", async ({
  page,
}) => {
  const user = await createVerifiedUser(page);
  await signIn(page, user);
  await page.goto("/files");
  const trigger = page.getByRole("button", { name: "New folder" });
  await trigger.focus();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Create folder" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

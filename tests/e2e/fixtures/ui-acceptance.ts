import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test as base,
  type Page,
  type TestInfo,
} from "@playwright/test";

type AcceptanceFixtures = {
  consoleErrors: string[];
};

export const test = base.extend<AcceptanceFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on(
      "console",
      /** Retains browser console errors for a route-level acceptance assertion. */ (
        message,
      ) => {
        if (message.type() === "error") errors.push(message.text());
      },
    );
    page.on(
      "pageerror",
      /** Retains uncaught runtime errors alongside console failures. */ (
        error,
      ) => {
        errors.push(error.message);
      },
    );
    await use(errors);
  },
});

export { expect };

/** Applies an effective theme before capturing a stable full-page review image. */
export async function captureVisualReview(
  page: Page,
  testInfo: TestInfo,
  name: string,
  options: { width: 1440 | 768 | 390; theme: "light" | "dark" },
): Promise<void> {
  await page.setViewportSize({ width: options.width, height: 900 });
  await page.evaluate(
    /** Persists the requested review theme through the product's public preference key. */ (
      theme,
    ) => localStorage.setItem("fileora-theme", theme),
    options.theme,
  );
  await page.reload();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("body")).toHaveAttribute(
    "data-theme",
    options.theme,
  );
  await expect(page).toHaveScreenshot(
    `${name}-${options.width}-${options.theme}.png`,
    {
      animations: "disabled",
      fullPage: true,
    },
  );
  await testInfo.attach(`${name}-${options.width}-${options.theme}`, {
    path: testInfo.snapshotPath(
      `${name}-${options.width}-${options.theme}.png`,
    ),
    contentType: "image/png",
  });
}

/** Proves that the supported 360 px page boundary does not hide content outside the viewport. */
export async function expectNoPageOverflow(page: Page): Promise<void> {
  await page.setViewportSize({ width: 360, height: 800 });
  const dimensions = await page.evaluate(
    /** Reads layout widths without mutating the rendered route. */ () => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }),
  );
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
}

/** Advances keyboard focus until the named control is reached or the bounded journey fails. */
export async function tabTo(
  page: Page,
  accessibleName: string | RegExp,
  maximumTabs = 40,
): Promise<void> {
  const target = page
    .getByRole("button", { name: accessibleName })
    .or(page.getByRole("link", { name: accessibleName }));
  for (let index = 0; index < maximumTabs; index += 1) {
    await page.keyboard.press("Tab");
    if (
      await target
        .evaluate(
          /** Identifies whether the expected keyboard target owns focus. */ (
            element,
          ) => element === document.activeElement,
        )
        .catch(
          /** Keeps the bounded traversal moving while the target is not yet resolvable. */ () =>
            false,
        )
    )
      return;
  }
  throw new Error(`Keyboard focus did not reach ${String(accessibleName)}`);
}

/** Runs the configured WCAG 2.2 A/AA automated scan for the current route state. */
export async function scanAccessibility(page: Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .disableRules(["color-contrast"])
    .analyze();
}

/** Fails route acceptance on any unclassified accessibility violation. */
export function expectNoAccessibilityViolations(
  results: Awaited<ReturnType<typeof scanAccessibility>>,
): void {
  expect(
    results.violations.map(
      /** Reduces a violation to actionable evidence without copying page content. */ (
        violation,
      ) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.map(
          /** Retains only the selector target needed to locate the failure. */ (
            node,
          ) => node.target,
        ),
      }),
    ),
  ).toEqual([]);
}

/** Verifies the route produced no unexpected browser console or runtime failures. */
export function expectNoConsoleErrors(errors: string[]): void {
  const unexpected = errors.filter(
    /** Excludes the expected anonymous session-probe response emitted by browser networking. */ (
      error,
    ) =>
      !/^Failed to load resource: the server responded with a status of 401 \(Unauthorized\)$/.test(
        error,
      ),
  );
  expect(unexpected).toEqual([]);
}

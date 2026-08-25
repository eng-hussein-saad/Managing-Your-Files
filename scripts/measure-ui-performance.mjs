import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const baseURL = process.env.PERF_BASE_URL ?? "http://localhost:3000";
const mailURL =
  process.env.PERF_MAIL_API_URL ?? "http://localhost:18025/api/v2/messages";
const outputPath = process.env.PERF_OUTPUT_PATH;
const repetitions = Number(process.env.PERF_REPETITIONS ?? "7");
const normalUser = {
  email: "ui-baseline-user@example.invalid",
  password: "BaselineUserPassword123!",
};
const administrator = {
  email: process.env.PERF_ADMIN_EMAIL ?? "admin-baseline@example.invalid",
  password: process.env.PERF_ADMIN_PASSWORD ?? "BaselinePassword123!",
};

/** Waits for the latest local verification message without exposing its code in output. */
async function verificationCode(email) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(mailURL);
    if (response.ok) {
      const payload = await response.json();
      const mailHogMessage = payload.items?.find((item) =>
        item.Content?.Headers?.To?.some((recipient) =>
          recipient.includes(email),
        ),
      );
      const mailHogCode =
        mailHogMessage?.Content?.Body?.match(/\b\d{8}\b/)?.[0];
      if (mailHogCode) return mailHogCode;
      const mailpitMessage = payload.messages?.find((item) =>
        item.To?.some((recipient) => recipient.Address === email),
      );
      if (mailpitMessage?.ID) {
        const detailURL = new URL(
          `/api/v1/message/${mailpitMessage.ID}`,
          mailURL,
        );
        const detailResponse = await fetch(detailURL);
        if (detailResponse.ok) {
          const detail = await detailResponse.json();
          const mailpitCode = detail.Text?.match(/\b\d{8}\b/)?.[0];
          if (mailpitCode) return mailpitCode;
        }
      }
    }
    await new Promise(
      /** Defers the next bounded mail poll. */ (resolve) =>
        setTimeout(resolve, 250),
    );
  }
  throw new Error("Verification message was not received");
}

/** Creates the fixed verified performance owner and its previewable file. */
async function seedNormalUser(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByLabel("Email").fill(normalUser.email);
  await page.getByLabel("Password").fill(normalUser.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  const existingUser = await page
    .waitForURL(/\/(dashboard|admin)$/, { timeout: 5_000 })
    .then(
      /** Records successful authentication without changing the measured state. */ () =>
        true,
      /** Treats a bounded login miss as a clean fixture-creation path. */ () =>
        false,
    );
  if (!existingUser) {
    await page.goto(`${baseURL}/register`);
    await page.getByLabel("Name").fill("UI Baseline User");
    await page.getByLabel("Email").fill(normalUser.email);
    await page.getByLabel(/^Password/).fill(normalUser.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await page
      .getByLabel("Eight-digit verification code")
      .fill(await verificationCode(normalUser.email));
    await page.getByRole("button", { name: "Verify email" }).click();
    await page.getByText(/Verified\. Taking you to sign in/i).waitFor();
    await signIn(page, normalUser);
  }
  await page.goto(`${baseURL}/files`);
  await page.getByRole("region", { name: "Files" }).waitFor();
  const previewExists = await page
    .getByText("baseline-preview.txt")
    .first()
    .isVisible();
  if (!previewExists) {
    await page.getByLabel(/select files/i).setInputFiles({
      name: "baseline-preview.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Fixed Fileora performance preview fixture."),
    });
    await page.getByRole("button", { name: /upload queued files/i }).click();
    await page
      .getByRole("list", { name: /upload queue/i })
      .getByText(/baseline-preview\.txt: success/i)
      .waitFor();
  }
  await context.close();
}

/** Authenticates one fixed identity outside the measured route interval. */
async function signIn(page, identity) {
  await page.goto(`${baseURL}/login`);
  await page.getByLabel("Email").fill(identity.email);
  await page.getByLabel("Password").fill(identity.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(dashboard|admin)$/);
}

/** Completes two paint opportunities after the semantic terminal state appears. */
async function twoFrames(page) {
  await page.evaluate(
    /** Resolves after two browser paint callbacks. */ () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

/** Measures one fresh-context journey and returns duration plus console diagnostics. */
async function measure(browser, name, setup, action) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on(
    "console",
    /** Captures browser errors without recording private page data. */ (
      message,
    ) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    },
  );
  await setup(page);
  const started = performance.now();
  await action(page);
  await twoFrames(page);
  const durationMs = Number((performance.now() - started).toFixed(2));
  await context.close();
  return { name, durationMs, consoleErrors };
}

/** Measures every required legacy route and interaction once in rotating order. */
async function measureRepetition(browser, repetition) {
  const uploadName = `baseline-upload-${repetition}.txt`;
  const journeys = {
    landing: () =>
      measure(
        browser,
        "landing",
        async () => {},
        async (page) => {
          await page.goto(`${baseURL}/`);
          await page.getByRole("main").waitFor();
          await page
            .getByRole("link", { name: /create/i })
            .first()
            .waitFor();
          await page
            .getByRole("link", { name: /sign in/i })
            .first()
            .waitFor();
        },
      ),
    signIn: () =>
      measure(
        browser,
        "sign-in",
        async () => {},
        async (page) => {
          await page.goto(`${baseURL}/login`);
          await page
            .getByRole("heading", { name: "Sign in to Fileora" })
            .waitFor();
          await page.getByRole("button", { name: "Sign in" }).waitFor();
        },
      ),
    dashboard: () =>
      measure(
        browser,
        "dashboard",
        (page) => signIn(page, normalUser),
        async (page) => {
          await page.goto(`${baseURL}/dashboard`);
          await page.getByRole("region", { name: "File activity" }).waitFor();
        },
      ),
    files: () =>
      measure(
        browser,
        "files",
        (page) => signIn(page, normalUser),
        async (page) => {
          await page.goto(`${baseURL}/files`);
          await page.getByRole("region", { name: "Files" }).waitFor();
          await page.getByText("baseline-preview.txt").first().waitFor();
        },
      ),
    details: () =>
      measure(
        browser,
        "details-preview",
        async (page) => {
          await signIn(page, normalUser);
          await page.goto(`${baseURL}/files`);
          await page.getByText("baseline-preview.txt").first().waitFor();
        },
        async (page) => {
          await page
            .getByRole("button", { name: /baseline-preview\.txt/i })
            .first()
            .click();
          await page
            .getByRole("complementary", { name: "File details" })
            .waitFor();
          await page.getByTitle(/Text preview/i).waitFor();
        },
      ),
    upload: () =>
      measure(
        browser,
        "upload",
        async (page) => {
          await signIn(page, normalUser);
          await page.goto(`${baseURL}/files`);
          await page.getByText("baseline-preview.txt").first().waitFor();
          await page.getByLabel(/select files/i).setInputFiles({
            name: uploadName,
            mimeType: "text/plain",
            buffer: Buffer.from(
              "Fixed repeated Fileora upload performance fixture.",
            ),
          });
        },
        async (page) => {
          await page
            .getByRole("button", { name: /upload queued files/i })
            .click();
          await page
            .getByRole("list", { name: /upload queue/i })
            .getByText(new RegExp(`${uploadName}: success`, "i"))
            .waitFor();
        },
      ),
    administrator: () =>
      measure(
        browser,
        "administrator",
        (page) => signIn(page, administrator),
        async (page) => {
          await page.goto(`${baseURL}/admin/users`);
          await page
            .getByRole("region", { name: "User administration" })
            .waitFor();
          await page.getByRole("button", { name: "Next" }).click();
          await page.getByText(/Page 2 of/).waitFor();
        },
      ),
  };
  const names = Object.keys(journeys);
  const rotated = names
    .slice(repetition % names.length)
    .concat(names.slice(0, repetition % names.length));
  const results = [];
  for (const name of rotated) results.push(await journeys[name]());
  return results;
}

/** Selects the middle value from seven sorted valid repetitions. */
function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Runs warm-up plus measured repetitions and emits reproducible JSON evidence. */
async function main() {
  const browser = await chromium.launch();
  try {
    await seedNormalUser(browser);
    await measureRepetition(browser, 0);
    const raw = [];
    for (let repetition = 1; repetition <= repetitions; repetition += 1) {
      raw.push(...(await measureRepetition(browser, repetition)));
    }
    const metricNames = [...new Set(raw.map((entry) => entry.name))];
    const medians = Object.fromEntries(
      metricNames.map((name) => [
        name,
        Number(
          median(
            raw
              .filter((entry) => entry.name === name)
              .map((entry) => entry.durationMs),
          ).toFixed(2),
        ),
      ]),
    );
    const result = {
      measuredAt: new Date().toISOString(),
      baseURL,
      repetitions,
      browserVersion: browser.version(),
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      medians,
      raw,
    };
    const json = `${JSON.stringify(result, null, 2)}\n`;
    if (outputPath) await writeFile(outputPath, json, "utf8");
    process.stdout.write(json);
  } finally {
    await browser.close();
  }
}

await main();

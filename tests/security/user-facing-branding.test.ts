import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { scanFiles } from "./prohibited-patterns";

const productFiles = [
  "client/src/app/layout.tsx",
  "client/src/app/page.tsx",
  "client/src/components/navigation/app-navigation.tsx",
  "client/src/components/status/page-state.tsx",
  "client/src/components/brand/fileora-brand.tsx",
];

describe("user-facing Fileora branding", () => {
  it("contains no legacy product label in designated surfaces", async () => {
    for (const file of productFiles) {
      const content = await readFile(resolve(file), "utf8");
      expect(content).not.toMatch(/Gold Era/i);
    }
  });

  it("keeps every user-facing source on approved branding and shared patterns", () => {
    const sources = scanFiles(["client/src"]).filter((file) =>
      /\.(?:tsx|ts|css)$/.test(file.path),
    );
    for (const file of sources) {
      expect(file.content, file.path).not.toMatch(/Gold Era/i);
      if (file.path.endsWith(".tsx")) {
        expect(file.content, file.path).not.toMatch(
          /className=["'](?:button|app-dialog|dialog-backdrop|icon-action|text-button)(?:\s|["'])/,
        );
      }
    }
  });
});

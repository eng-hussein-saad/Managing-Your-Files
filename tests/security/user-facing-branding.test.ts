import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

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
});

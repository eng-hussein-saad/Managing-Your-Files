import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { prohibitedValues, scanFiles } from "./prohibited-patterns";
describe("safe example configuration", () => {
  it("contains placeholders rather than usable credentials", () => {
    const server = readFileSync(resolve("server/.env.example"), "utf8");
    const client = readFileSync(resolve("client/.env.example"), "utf8");
    expect(`${server}\n${client}`).not.toMatch(
      /sk-[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}/,
    );
    expect(client).not.toMatch(/^NEXT_PUBLIC_.*(?:SECRET|PASSWORD|TOKEN)=/m);
  });
});
describe("prohibited secret artifacts", () => {
  it("finds no usable credentials in fixtures, public source, or built browser assets", () => {
    const files = scanFiles([
      "client/src",
      "client/.next/static",
      "server/tests/fixtures",
      "tests/e2e",
    ]);
    const findings = files.flatMap((file) =>
      prohibitedValues
        .filter((pattern) => pattern.test(file.content))
        .map((pattern) => `${file.path}: ${pattern.source}`),
    );
    expect(findings).toEqual([]);
  });
});

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

/** Extracts environment assignment keys from a safe example. */
function exampleKeys(content: string): string[] {
  return content.split(/\r?\n/).flatMap((line) => {
    const match = /^([A-Z][A-Z0-9_]*)=/.exec(line);
    return match?.[1] ? [match[1]] : [];
  });
}

describe("configuration parity and classification", () => {
  it("keeps every server example key represented in validation and Compose", async () => {
    const [example, validator, compose] = await Promise.all([
      readFile("server/.env.example", "utf8"),
      readFile("server/src/config/env.ts", "utf8"),
      readFile("compose.yaml", "utf8"),
    ]);
    for (const key of exampleKeys(example)) {
      expect(validator).toContain(key);
      expect(compose).toContain(key);
    }
  });
  it("classifies only the API base URL as browser-public", async () => {
    const [example, publicValidator, serverValidator] = await Promise.all([
      readFile("client/.env.example", "utf8"),
      readFile("client/src/lib/config/public-env.ts", "utf8"),
      readFile("client/src/lib/config/server-env.ts", "utf8"),
    ]);
    const publicKeys = exampleKeys(example).filter((key) => key.startsWith("NEXT_PUBLIC_"));
    expect(publicKeys).toEqual(["NEXT_PUBLIC_API_BASE_URL"]);
    expect(publicValidator).not.toMatch(/SECRET|PASSWORD|REFRESH_TOKEN/);
    for (const key of exampleKeys(example).filter((key) => !key.startsWith("NEXT_PUBLIC_")))
      expect(serverValidator).toContain(key);
  });
});

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("container smoke contract", () => {
  it("defines pinned images, one-shot migration, health dependencies, and persistent data", async () => {
    const [server, client, compose, ignore] = await Promise.all([
      readFile("Dockerfile", "utf8"),
      readFile("client/Dockerfile", "utf8"),
      readFile("compose.yaml", "utf8"),
      readFile(".dockerignore", "utf8"),
    ]);
    expect(server).toContain("node:24.7.0-bookworm-slim");
    expect(client).toContain("node:24.7.0-bookworm-slim");
    expect(compose).toContain("dockerfile: Dockerfile");
    expect(compose).toContain("dockerfile: client/Dockerfile");
    expect(compose).toContain("service_completed_successfully");
    expect(compose).toContain("fileora-postgres:/var/lib/postgresql/data");
    expect(ignore).toMatch(/\.env\.\*/);
  });
});

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

/** Reads one repository artifact relative to this integration test. */
async function artifact(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

describe("approved permanent user lifecycle schema", () => {
  it("keeps diagram, Prisma, and migration aligned without USER.deletedAt", async () => {
    const [diagram, schema, migration] = await Promise.all([
      artifact("../../../database-schema.mmd"),
      artifact("../../prisma/schema.prisma"),
      artifact("../../prisma/migrations/003_administration_final_quality/migration.sql"),
    ]);
    expect(diagram).not.toMatch(/USER\s*\{[\s\S]*?deletedAt/);
    expect(schema).not.toMatch(/model User\s*\{[\s\S]*?deletedAt/);
    expect(migration).toContain('FROM "USER" WHERE "deletedAt" IS NOT NULL');
    expect(migration).toContain('ALTER TABLE "USER" DROP COLUMN "deletedAt"');
  });
});

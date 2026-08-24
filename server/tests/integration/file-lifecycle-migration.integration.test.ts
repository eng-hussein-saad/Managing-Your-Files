import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const migrationPath = new URL(
  "../../prisma/migrations/002_user_file_management/migration.sql",
  import.meta.url,
);
const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);
describe("file lifecycle migration", () => {
  it("refuses legacy soft-deleted file or folder records before destructive column removal", async () => {
    const migration = await readFile(migrationPath, "utf8");
    expect(migration).toContain('FROM "FILE" WHERE "deletedAt" IS NOT NULL');
    expect(migration).toContain('FROM "FOLDER" WHERE "deletedAt" IS NOT NULL');
  });
  it("keeps the canonical six entities with only the approved lifecycle difference", async () => {
    const schema = await readFile(schemaPath, "utf8");
    expect(schema).toContain("model User");
    expect(schema).not.toMatch(/model User[\s\S]*?deletedAt/);
    expect(schema).not.toMatch(/model File[\s\S]*?deletedAt/);
    expect(schema).not.toMatch(/model Folder[\s\S]*?deletedAt/);
  });
});

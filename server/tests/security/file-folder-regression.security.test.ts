import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { auditActions } from "../../src/modules/audit/audit.types.js";

describe("file and folder security regression", () => {
  it("retains every centralized successful file/folder audit action", () => {
    expect(auditActions).toEqual(expect.arrayContaining(["file.upload", "file.move", "file.delete", "folder.create", "folder.rename", "folder.delete"]));
    expect(auditActions).not.toContain("file.download");
  });
  it("keeps administrator content capabilities absent while owner routes remain protected", async () => {
    const [adminRoutes, ownerRoutes] = await Promise.all([
      readFile(new URL("../../src/http/routes/admin.routes.ts", import.meta.url), "utf8"),
      readFile(new URL("../../src/http/routes/file.routes.ts", import.meta.url), "utf8"),
    ]);
    expect(adminRoutes).not.toMatch(/preview|download|signed|extracted/i);
    expect(ownerRoutes).toContain('router.get("/:fileId/preview", authenticate');
    expect(ownerRoutes).toContain('router.get("/:fileId/download", authenticate');
  });
});

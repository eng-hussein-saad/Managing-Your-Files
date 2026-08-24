import { describe, expect, it } from "vitest";
import { adminFileDeleteSchema, adminFilePageSchema, adminFileQuerySchema } from "@gold-era/contracts/public";
import { safeAdminFileFixture } from "../fixtures/admin.js";

describe("administrator global file contracts", () => {
  it("accepts decimal bytes and rejects private content capabilities", () => {
    const file = safeAdminFileFixture();
    expect(adminFilePageSchema.safeParse({ success: true, data: [file], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } }).success).toBe(true);
    expect(adminFilePageSchema.safeParse({ success: true, data: [{ ...file, storageKey: "private" }], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } }).success).toBe(false);
  });
  it("validates combined filters and size ranges", () => {
    expect(adminFileQuerySchema.safeParse({ type: "pdf", minSizeBytes: "10", maxSizeBytes: "9" }).success).toBe(false);
    expect(adminFileQuerySchema.safeParse({ type: "pdf", folder: "root", pageSize: "10" }).success).toBe(true);
  });
  it("requires exact target identity and version fields", () => {
    expect(adminFileDeleteSchema.safeParse({ expectedUpdatedAt: "2026-08-23T00:00:00.000Z", confirmationOriginalName: "report.pdf" }).success).toBe(true);
    expect(adminFileDeleteSchema.safeParse({ confirmationOriginalName: "report.pdf" }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { adminAuditPageSchema, adminAuditQuerySchema, adminStatisticsResponseSchema } from "@gold-era/contracts/public";
import { safeAdminAuditFixture, safeAdminStatisticsFixture } from "../fixtures/admin.js";

describe("administrator monitoring contracts", () => {
  it("accepts exact bigint-safe statistics", () => {
    expect(adminStatisticsResponseSchema.safeParse({ success: true, data: safeAdminStatisticsFixture() }).success).toBe(true);
  });
  it("accepts live actor history and rejects unsafe metadata", () => {
    const event = safeAdminAuditFixture();
    expect(adminAuditPageSchema.safeParse({ success: true, data: [event], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } }).success).toBe(true);
    expect(adminAuditPageSchema.safeParse({ success: true, data: [{ ...event, metadata: { ...event.metadata, storageKey: "secret" } }], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } }).success).toBe(false);
  });
  it("strictly validates audit filters", () => {
    expect(adminAuditQuerySchema.safeParse({ actorState: "deleted", pageSize: "10" }).success).toBe(true);
    expect(adminAuditQuerySchema.safeParse({ actorState: "unknown" }).success).toBe(false);
  });
});

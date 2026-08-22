import { describe, expect, it } from "vitest";
import { fileQuerySchema } from "../../src/http/schemas/file-query.schemas.js";

describe("file query schema", () => {
  it("defaults to 20 files per page", () => {
    expect(fileQuerySchema.parse({}).pageSize).toBe(20);
  });

  it("accepts only the user-selectable page sizes", () => {
    for (const pageSize of [5, 10, 20]) {
      expect(fileQuerySchema.safeParse({ pageSize }).success).toBe(true);
    }
    expect(fileQuerySchema.safeParse({ pageSize: 15 }).success).toBe(false);
    expect(fileQuerySchema.safeParse({ pageSize: 100 }).success).toBe(false);
  });
});

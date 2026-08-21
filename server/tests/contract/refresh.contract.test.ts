import { describe, expect, it } from "vitest";
import {
  optionalRawRefreshRequestSchema,
  rawRefreshRequestSchema,
} from "@gold-era/contracts/internal";
describe("refresh contracts", () => {
  it("requires opaque material for rotation and permits absence only for logout", () => {
    expect(
      rawRefreshRequestSchema.safeParse({ refreshToken: "r".repeat(43) })
        .success,
    ).toBe(true);
    expect(
      rawRefreshRequestSchema.safeParse({ refreshToken: "short" }).success,
    ).toBe(false);
    expect(optionalRawRefreshRequestSchema.safeParse({}).success).toBe(true);
  });
});

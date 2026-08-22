import supertest from "supertest";
import { expect, it } from "vitest";
import { fileStatisticsSchema } from "@gold-era/contracts/public";
import {
  describeDatabase,
  fileManagementHarness,
} from "../helpers/integration.js";

describeDatabase("file statistics contract", () => {
  const { app } = fileManagementHarness();
  it("requires a valid IANA timezone and returns exact empty shapes", async () => {
    const response = await supertest(app)
      .get("/api/v1/file-statistics?timeZone=Africa%2FCairo")
      .expect(200);
    expect(fileStatisticsSchema.safeParse(response.body.data).success).toBe(
      true,
    );
    expect(response.body.data).toMatchObject({
      fileCount: 0,
      storedBytes: "0",
      quota: {
        usedBytes: "0",
        remainingBytes: "104857600",
        limitBytes: "104857600",
      },
      timeZone: "Africa/Cairo",
    });
    expect(response.body.data.typeDistribution).toEqual([
      { type: "pdf", count: 0 },
      { type: "text", count: 0 },
      { type: "image", count: 0 },
      { type: "document", count: 0 },
    ]);
    expect(response.body.data.uploadHistory).toHaveLength(30);
  });
  it("rejects missing, invalid, and overlong timezone values safely", async () => {
    for (const query of [
      "",
      "?timeZone=Not%2FAZone",
      `?timeZone=${"x".repeat(101)}`,
    ]) {
      const response = await supertest(app)
        .get(`/api/v1/file-statistics${query}`)
        .expect(400);
      expect(response.body.error.code).toBe("VALIDATION_FAILED");
    }
  });
});

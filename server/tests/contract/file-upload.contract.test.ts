import { stat } from "node:fs/promises";
import express, { type RequestHandler } from "express";
import supertest from "supertest";
import { describe, expect, it } from "vitest";
import {
  errorEnvelopeSchema,
  fileResponseSchema,
  quotaErrorEnvelopeSchema,
  uploadPolicyResponseSchema,
} from "@gold-era/contracts/public";
import { fileUploadController } from "../../src/http/controllers/file-upload.controller.js";
import { errorHandler } from "../../src/http/middleware/errors.js";
import { requestId } from "../../src/http/middleware/request-id.js";
import { fileRoutes } from "../../src/http/routes/file.routes.js";
import {
  allowedUploadMimeTypes,
  maxFileSizeBytes,
  maxFilesPerBatch,
} from "../../src/http/schemas/file-upload.schemas.js";
import {
  fileNotFound,
  fileTooLarge,
  quotaExceeded,
} from "../../src/modules/files/file.errors.js";
import type { UploadFileService } from "../../src/modules/files/services/upload-file.service.js";

const ownerId = "025e4f62-3475-4309-9c84-02b9a2c177c4";
const ownedFolderId = "a8f2543d-ea16-45d7-9c72-8a93975e434a";
const foreignFolderId = "374409de-828d-4af2-8a8c-928fbcd33eaf";

/** Creates an isolated HTTP contract app without database or provider credentials. */
function contractApp() {
  const service = {
    policyQuota: async () => ({
      usedBytes: "12",
      remainingBytes: "104857588",
      limitBytes: "104857600",
    }),
    upload: async (
      _owner: string,
      input: { path: string; originalName: string; folderId?: string },
    ) => {
      if (input.folderId === foreignFolderId) throw fileNotFound();
      if (input.originalName === "quota.txt") throw quotaExceeded();
      const size = (await stat(input.path)).size;
      if (size > maxFileSizeBytes) throw fileTooLarge();
      return {
        id: "8f959aad-4c66-4bc7-883a-1cb09eade4ad",
        originalName: input.originalName,
        mimeType: "text/plain",
        typeCategory: "text",
        sizeBytes: size.toString(),
        folder: input.folderId ? { id: ownedFolderId, name: "Owned" } : null,
        uploadedAt: "2026-08-22T00:00:00.000Z",
        previewKind: "text",
        extractionState: "available",
      };
    },
  };
  const controller = fileUploadController(
    service as unknown as UploadFileService,
    {
      maxFileSizeBytes: maxFileSizeBytes.toString(),
      maxFilesPerBatch,
      allowedMimeTypes: [...allowedUploadMimeTypes],
    },
  );
  const authenticate: RequestHandler = (_request, response, next) => {
    response.locals.identity = { subject: ownerId, role: "USER" };
    next();
  };
  const app = express();
  app.use(requestId);
  app.use("/api/v1/files", fileRoutes(authenticate, controller));
  app.use(errorHandler({ error: () => undefined, critical: () => undefined }));
  return app;
}

describe("file upload HTTP contract", () => {
  const app = contractApp();

  it("returns exact policy, supported types, batch limit, and decimal quota metadata", async () => {
    const response = await supertest(app)
      .get("/api/v1/files/policy")
      .expect(200);
    expect(uploadPolicyResponseSchema.safeParse(response.body).success).toBe(
      true,
    );
    expect(response.body.data).toMatchObject({
      maxFileSizeBytes: "5242880",
      maxFilesPerBatch: 10,
      allowedMimeTypes: [...allowedUploadMimeTypes],
      quota: {
        usedBytes: "12",
        remainingBytes: "104857588",
        limitBytes: "104857600",
      },
    });
  });

  it("accepts one file at the inclusive 5 MB boundary", async () => {
    const response = await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.alloc(maxFileSizeBytes, 0x61), "boundary.txt")
      .expect(201);
    expect(fileResponseSchema.safeParse(response.body).success).toBe(true);
    expect(response.body.data.sizeBytes).toBe("5242880");
  });

  it("rejects a file over the boundary and more than one file with safe envelopes", async () => {
    const tooLarge = await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.alloc(maxFileSizeBytes + 1, 0x61), "large.txt")
      .expect(413);
    expect(errorEnvelopeSchema.safeParse(tooLarge.body).success).toBe(true);
    expect(tooLarge.body.error.code).toBe("FILE_TOO_LARGE");
    const many = await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("one"), "one.txt")
      .attach("file", Buffer.from("two"), "two.txt")
      .expect(400);
    expect(errorEnvelopeSchema.safeParse(many.body).success).toBe(true);
  });

  it("validates folder identifiers and hides foreign folder existence", async () => {
    const malformed = await supertest(app)
      .post("/api/v1/files")
      .field("folderId", "not-a-uuid")
      .attach("file", Buffer.from("file"), "file.txt")
      .expect(400);
    expect(malformed.body.error.code).toBe("VALIDATION_FAILED");
    const foreign = await supertest(app)
      .post("/api/v1/files")
      .field("folderId", foreignFolderId)
      .attach("file", Buffer.from("file"), "file.txt")
      .expect(404);
    expect(foreign.body.error).toMatchObject({
      code: "RESOURCE_NOT_FOUND",
      message: "The requested resource was not found.",
    });
  });

  it("returns the quota failure as a safe validation outcome", async () => {
    const response = await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("file"), "quota.txt")
      .expect(422);
    expect(quotaErrorEnvelopeSchema.safeParse(response.body).success).toBe(
      true,
    );
    expect(response.body.error.code).toBe("FILE_QUOTA_EXCEEDED");
    expect(response.body.meta).toEqual({
      usedBytes: "0",
      remainingBytes: "0",
      limitBytes: "104857600",
    });
  });
});

import { z } from "zod";
import { successEnvelope } from "./envelopes.js";
import { errorBodySchema } from "./envelopes.js";

export const decimalBytesSchema = z.string().regex(/^\d+$/);
export const fileTypeCategorySchema = z.enum([
  "pdf",
  "text",
  "image",
  "document",
]);
export const extractionStateSchema = z.enum(["available", "unavailable"]);
export const previewKindSchema = z.enum([
  "pdf",
  "text",
  "image",
  "unavailable",
]);
export const folderSummarySchema = z
  .object({ id: z.uuid(), name: z.string().min(1).max(120) })
  .strict();
export const quotaSnapshotSchema = z
  .object({
    usedBytes: decimalBytesSchema,
    remainingBytes: decimalBytesSchema,
    limitBytes: decimalBytesSchema,
  })
  .strict();
export const fileSummarySchema = z
  .object({
    id: z.uuid(),
    originalName: z.string().min(1).max(255),
    mimeType: z.string(),
    typeCategory: fileTypeCategorySchema,
    sizeBytes: decimalBytesSchema,
    folder: folderSummarySchema.nullable(),
    uploadedAt: z.iso.datetime(),
    previewKind: previewKindSchema,
    extractionState: extractionStateSchema,
  })
  .strict();
export const fileDetailSchema = fileSummarySchema
  .extend({
    folderPath: z.array(folderSummarySchema),
    extractedContent: z.string().nullable(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const fileResponseSchema = successEnvelope(fileSummarySchema);
export const paginationSchema = z
  .object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export const filePageResponseSchema = successEnvelope(
  z.array(fileSummarySchema),
);
export const uploadPolicySchema = z
  .object({
    maxFileSizeBytes: decimalBytesSchema,
    maxFilesPerBatch: z.literal(10),
    allowedMimeTypes: z.array(z.string()).length(6),
    quota: quotaSnapshotSchema,
  })
  .strict();
export const uploadPolicyResponseSchema = successEnvelope(uploadPolicySchema);
export const quotaErrorEnvelopeSchema = z
  .object({
    success: z.literal(false),
    error: errorBodySchema,
    meta: quotaSnapshotSchema,
  })
  .strict();
export type FileSummary = z.infer<typeof fileSummarySchema>;
export type FileDetail = z.infer<typeof fileDetailSchema>;
export type QuotaSnapshot = z.infer<typeof quotaSnapshotSchema>;

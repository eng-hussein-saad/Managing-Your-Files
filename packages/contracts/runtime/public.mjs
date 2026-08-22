import { z } from "zod";
export const errorCodes = [
  "VALIDATION_FAILED",
  "AUTH_REGISTRATION_UNAVAILABLE",
  "AUTH_VERIFICATION_DELIVERY_PENDING",
  "AUTH_VERIFICATION_INVALID",
  "AUTH_VERIFICATION_REQUIRED",
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_ACCESS_INVALID",
  "AUTH_ACCESS_EXPIRED",
  "AUTH_REFRESH_INVALID",
  "AUTHENTICATION_FAILED",
  "AUTH_REQUIRED",
  "AUTH_FORBIDDEN",
  "RATE_LIMITED",
  "SERVICE_UNAVAILABLE",
  "TRUST_REQUIRED",
  "RESOURCE_NOT_FOUND",
  "FILE_TOO_LARGE",
  "FILE_TYPE_UNSUPPORTED",
  "FILE_QUOTA_EXCEEDED",
  "FOLDER_NAME_CONFLICT",
  "FOLDER_DEPTH_EXCEEDED",
  "FOLDER_NOT_EMPTY",
  "PREVIEW_UNAVAILABLE",
];
export const fieldIssueSchema = z
  .object({ field: z.string(), message: z.string() })
  .strict();
export const errorCodeSchema = z.enum(errorCodes);
export const errorBodySchema = z
  .object({
    code: errorCodeSchema,
    message: z.string(),
    fields: z.array(fieldIssueSchema).optional(),
    requestId: z.string().optional(),
  })
  .strict();
export const errorEnvelopeSchema = z
  .object({ success: z.literal(false), error: errorBodySchema })
  .strict();
export const successEnvelope = (data) =>
  z
    .object({
      success: z.literal(true),
      data,
      meta: z.record(z.string(), z.unknown()).optional(),
    })
    .strict();
export const roleSchema = z.enum(["USER", "ADMIN"]);
export const safeUserSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    role: roleSchema,
    isEmailVerified: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const userResponseSchema = successEnvelope(safeUserSchema);
const normalizedEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(320));
export const registerRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: normalizedEmail,
    password: z.string().min(8).max(1024),
  })
  .strict();
export const emailRequestSchema = z.object({ email: normalizedEmail }).strict();
export const verifyEmailRequestSchema = z
  .object({ email: normalizedEmail, code: z.string().regex(/^\d{8}$/) })
  .strict();
export const loginRequestSchema = z
  .object({ email: normalizedEmail, password: z.string().min(1).max(1024) })
  .strict();
export const registrationResponseSchema = successEnvelope(
  z
    .object({ email: z.email(), verificationRequired: z.literal(true) })
    .strict(),
);
export const messageResponseSchema = successEnvelope(
  z.object({ message: z.string() }).strict(),
);
export const accessSessionSchema = z
  .object({
    accessToken: z.string(),
    tokenType: z.literal("Bearer"),
    expiresIn: z.number().int().positive(),
    user: safeUserSchema,
  })
  .strict();
export const authSessionResponseSchema = successEnvelope(accessSessionSchema);
export const logoutResponseSchema = successEnvelope(
  z.object({ loggedOut: z.literal(true) }).strict(),
);
export const adminAccessResponseSchema = successEnvelope(
  z.object({ allowed: z.literal(true) }).strict(),
);
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
export const folderSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1).max(120),
    parentId: z.uuid().nullable(),
    depth: z.number().int().min(1).max(10),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const createFolderRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    parentId: z.uuid().nullable(),
  })
  .strict();
export const renameFolderRequestSchema = z
  .object({ name: z.string().trim().min(1).max(120) })
  .strict();
export const moveFileRequestSchema = z
  .object({ folderId: z.uuid().nullable() })
  .strict();
export const folderContentsSchema = z
  .object({
    folder: folderSchema.nullable(),
    breadcrumbs: z.array(folderSummarySchema),
    folders: z.array(folderSchema),
    files: z.array(fileSummarySchema),
  })
  .strict();
export const ianaTimeZoneSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Must be an IANA time zone");
export const fileStatisticsSchema = z
  .object({
    fileCount: z.number().int().nonnegative(),
    storedBytes: decimalBytesSchema,
    quota: quotaSnapshotSchema,
    typeDistribution: z.array(
      z
        .object({
          type: fileTypeCategorySchema,
          count: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    uploadHistory: z
      .array(
        z
          .object({ date: z.iso.date(), count: z.number().int().nonnegative() })
          .strict(),
      )
      .length(30),
    timeZone: ianaTimeZoneSchema,
  })
  .strict();

import { z } from "zod";
import { errorEnvelopeSchema, successEnvelope } from "./envelopes.js";
import { roleSchema, safeUserSchema } from "./users.js";

export const adminAccessResponseSchema = successEnvelope(
  z.object({ allowed: z.literal(true) }).strict(),
);

export const adminPageSizeSchema = z.coerce
  .number()
  .int()
  .refine((value) => [5, 10, 20].includes(value), {
    message: "Page size must be one of 5, 10, or 20",
  });
export const adminPageMetaSchema = z
  .object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
  .strict();
export const adminUserSchema = safeUserSchema;
export const adminUserQuerySchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    role: roleSchema.optional(),
    verified: z.coerce.boolean().optional(),
    sort: z.enum(["name", "email", "role", "createdAt"]).default("createdAt"),
    direction: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: adminPageSizeSchema.default(20),
  })
  .strict();
export const adminRoleChangeSchema = z
  .object({ role: roleSchema, expectedUpdatedAt: z.iso.datetime() })
  .strict();
export const adminUserDeleteSchema = z
  .object({
    expectedUpdatedAt: z.iso.datetime(),
    confirmationEmail: z.email(),
  })
  .strict();
export const adminUserResponseSchema = successEnvelope(adminUserSchema);
export const adminUserPageSchema = z
  .object({
    success: z.literal(true),
    data: z.array(adminUserSchema),
    meta: adminPageMetaSchema,
  })
  .strict();

export const adminFileTypeSchema = z.enum(["pdf", "text", "image", "document"]);
export const adminOwnerSummarySchema = z
  .object({ id: z.uuid(), name: z.string(), email: z.email() })
  .strict();
export const adminFolderSummarySchema = z
  .object({ id: z.uuid(), name: z.string() })
  .strict();
export const adminFileSchema = z
  .object({
    id: z.uuid(),
    owner: adminOwnerSummarySchema,
    originalName: z.string(),
    mimeType: z.string(),
    type: adminFileTypeSchema,
    sizeBytes: z.string().regex(/^\d+$/),
    folder: adminFolderSummarySchema.nullable(),
    uploadedAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const adminFileQuerySchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    ownerId: z.uuid().optional(),
    type: adminFileTypeSchema.optional(),
    uploadedFrom: z.iso.date().optional(),
    minSizeBytes: z.coerce.bigint().nonnegative().optional(),
    maxSizeBytes: z.coerce.bigint().nonnegative().optional(),
    uploadedBefore: z.iso.datetime().optional(),
    folder: z.enum(["any", "root", "foldered"]).default("any"),
    sort: z.enum(["name", "owner", "size", "uploadedAt"]).default("uploadedAt"),
    direction: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: adminPageSizeSchema.default(20),
  })
  .strict()
  .refine(
    (query) =>
      query.minSizeBytes === undefined ||
      query.maxSizeBytes === undefined ||
      query.minSizeBytes <= query.maxSizeBytes,
    { message: "Minimum size cannot exceed maximum size", path: ["minSizeBytes"] },
  );
export const adminFileDeleteSchema = z
  .object({
    expectedUpdatedAt: z.iso.datetime(),
    confirmationOriginalName: z.string().min(1).max(255),
  })
  .strict();
export const adminFileResponseSchema = successEnvelope(adminFileSchema);
export const adminFilePageSchema = z
  .object({
    success: z.literal(true),
    data: z.array(adminFileSchema),
    meta: adminPageMetaSchema,
  })
  .strict();

export const adminAuditMetadataSchema = z
  .object({
    outcome: z.enum(["SUCCESS", "FAILURE", "DENIED"]).optional(),
    reasonCode: z.string().optional(),
    requestId: z.string().optional(),
  })
  .strict();
export const adminAuditActorSchema = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.literal("user"), id: z.uuid(), name: z.string(), email: z.email() })
    .strict(),
  z.object({ kind: z.literal("deleted"), label: z.literal("Deleted user") }).strict(),
  z.object({ kind: z.literal("system"), label: z.literal("System") }).strict(),
]);
export const adminAuditEventSchema = z
  .object({
    id: z.uuid(),
    actor: adminAuditActorSchema,
    action: z.string(),
    entityType: z.enum(["USER", "REFRESH_TOKEN", "FILE", "FOLDER"]).nullable(),
    entityId: z.string().nullable(),
    metadata: adminAuditMetadataSchema,
    createdAt: z.iso.datetime(),
  })
  .strict();
export const adminAuditQuerySchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    action: z.string().max(100).optional(),
    entityType: z.enum(["USER", "REFRESH_TOKEN", "FILE", "FOLDER"]).optional(),
    actorId: z.uuid().optional(),
    actorState: z.enum(["user", "deleted", "system"]).optional(),
    outcome: z.enum(["SUCCESS", "FAILURE", "DENIED"]).optional(),
    createdFrom: z.iso.datetime().optional(),
    createdBefore: z.iso.datetime().optional(),
    direction: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: adminPageSizeSchema.default(20),
  })
  .strict();
export const adminAuditPageSchema = z
  .object({
    success: z.literal(true),
    data: z.array(adminAuditEventSchema),
    meta: adminPageMetaSchema,
  })
  .strict();
export const adminStatisticsSchema = z
  .object({
    totalUsers: z.number().int().min(0),
    totalFiles: z.number().int().min(0),
    storedBytes: z.string().regex(/^\d+$/),
    typeDistribution: z.array(
      z.object({ type: adminFileTypeSchema, count: z.number().int().min(0) }).strict(),
    ),
    recentUploads: z.array(adminFileSchema).max(10),
    computedAt: z.iso.datetime(),
  })
  .strict();
export const adminStatisticsResponseSchema = successEnvelope(adminStatisticsSchema);
export const adminErrorResponseSchema = errorEnvelopeSchema;

export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;
export type AdminRoleChange = z.infer<typeof adminRoleChangeSchema>;
export type AdminUserDelete = z.infer<typeof adminUserDeleteSchema>;
export type AdminFile = z.infer<typeof adminFileSchema>;
export type AdminFileQuery = z.infer<typeof adminFileQuerySchema>;
export type AdminFileDelete = z.infer<typeof adminFileDeleteSchema>;
export type AdminStatistics = z.infer<typeof adminStatisticsSchema>;
export type AdminAuditEvent = z.infer<typeof adminAuditEventSchema>;
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;
export type AdminPageMeta = z.infer<typeof adminPageMetaSchema>;

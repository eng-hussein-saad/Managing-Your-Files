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
] as const;

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

export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

/** Creates the standard success envelope schema for a result payload. */
export const successEnvelope = <T extends z.ZodType>(data: T) =>
  z
    .object({
      success: z.literal(true),
      data,
      meta: z.record(z.string(), z.unknown()).optional(),
    })
    .strict();

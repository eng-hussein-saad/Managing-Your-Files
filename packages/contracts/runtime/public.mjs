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

import { z } from "zod";
import { successEnvelope } from "./envelopes.js";
import { safeUserSchema } from "./users.js";

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
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AccessSession = z.infer<typeof accessSessionSchema>;

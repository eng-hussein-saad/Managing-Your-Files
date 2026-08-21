import { z } from "zod";
import { loginRequestSchema, successEnvelope } from "../public/index.js";
import { safeUserSchema } from "../public/users.js";

export { loginRequestSchema };
export const rawRefreshRequestSchema = z
  .object({ refreshToken: z.string().min(40) })
  .strict();
export const optionalRawRefreshRequestSchema = z
  .object({ refreshToken: z.string().min(40).optional() })
  .strict();
export const trustedAuthResultSchema = z
  .object({
    accessToken: z.string(),
    tokenType: z.literal("Bearer"),
    expiresIn: z.number().int().positive(),
    refreshToken: z.string().min(40),
    refreshExpiresAt: z.iso.datetime(),
    user: safeUserSchema,
  })
  .strict();
export const trustedAuthResponseSchema = successEnvelope(
  trustedAuthResultSchema,
);
export type TrustedAuthResult = z.infer<typeof trustedAuthResultSchema>;

import { z } from "zod";
const serverEnvSchema = z
  .object({
    AUTH_API_BASE_URL: z.url(),
    AUTH_BFF_SHARED_SECRET: z.string().min(32),
    REFRESH_COOKIE_NAME: z.string().regex(/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/),
    REFRESH_COOKIE_PATH: z.literal("/api/auth"),
    REFRESH_COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]),
    REFRESH_COOKIE_SECURE: z
      .enum(["true", "false"])
      .transform((value) => value === "true"),
    REFRESH_TOKEN_TTL: z.string().regex(/^\d+(?:s|m|h|d)$/),
  })
  .strict()
  .superRefine((value, context) => {
    if (process.env.NODE_ENV === "production" && !value.REFRESH_COOKIE_SECURE)
      context.addIssue({
        code: "custom",
        path: ["REFRESH_COOKIE_SECURE"],
        message: "Production cookies must be secure",
      });
  });
export type ClientServerEnv = z.infer<typeof serverEnvSchema>;
/** Validates every server-only gateway setting before use. */
export function serverEnv(): ClientServerEnv {
  return serverEnvSchema.parse({
    AUTH_API_BASE_URL: process.env.AUTH_API_BASE_URL,
    AUTH_BFF_SHARED_SECRET: process.env.AUTH_BFF_SHARED_SECRET,
    REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME,
    REFRESH_COOKIE_PATH: process.env.REFRESH_COOKIE_PATH,
    REFRESH_COOKIE_SAME_SITE: process.env.REFRESH_COOKIE_SAME_SITE,
    REFRESH_COOKIE_SECURE: process.env.REFRESH_COOKIE_SECURE,
    REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL,
  });
}

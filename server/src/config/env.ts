import { z } from "zod";

const durationPattern = /^\d+(?:s|m|h|d)$/;
const booleanString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");
const serverEnvSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z
      .url()
      .refine(
        (value) =>
          value.startsWith("postgresql://") || value.startsWith("postgres://"),
        "Must be a PostgreSQL URL",
      ),
    JWT_ACCESS_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL: z.string().regex(durationPattern).default("15m"),
    REFRESH_TOKEN_TTL: z.string().regex(durationPattern).default("30d"),
    BFF_SHARED_SECRET: z.string().min(32),
    CORS_ALLOWED_ORIGINS: z
      .string()
      .refine(
        (value) =>
          !value.includes("*") &&
          value
            .split(",")
            .every((origin) => z.url().safeParse(origin.trim()).success),
        "Must contain explicit absolute origins",
      ),
    EMAIL_FROM: z.string().min(3),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535),
    SMTP_SECURE: booleanString,
    SMTP_USER: z.string().min(1),
    SMTP_PASSWORD: z.string().min(1),
    ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
    ADMIN_PASSWORD: z.string().min(8).max(1024),
    ADMIN_NAME: z.string().trim().min(1).max(120),
  })
  .strict();

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Parses and validates all server configuration before traffic is accepted. */
export function parseServerEnv(input: NodeJS.ProcessEnv): ServerEnv {
  return serverEnvSchema.parse({
    PORT: input.PORT,
    DATABASE_URL: input.DATABASE_URL,
    JWT_ACCESS_SECRET: input.JWT_ACCESS_SECRET,
    ACCESS_TOKEN_TTL: input.ACCESS_TOKEN_TTL,
    REFRESH_TOKEN_TTL: input.REFRESH_TOKEN_TTL,
    BFF_SHARED_SECRET: input.BFF_SHARED_SECRET,
    CORS_ALLOWED_ORIGINS: input.CORS_ALLOWED_ORIGINS,
    EMAIL_FROM: input.EMAIL_FROM,
    SMTP_HOST: input.SMTP_HOST,
    SMTP_PORT: input.SMTP_PORT,
    SMTP_SECURE: input.SMTP_SECURE,
    SMTP_USER: input.SMTP_USER,
    SMTP_PASSWORD: input.SMTP_PASSWORD,
    ADMIN_EMAIL: input.ADMIN_EMAIL,
    ADMIN_PASSWORD: input.ADMIN_PASSWORD,
    ADMIN_NAME: input.ADMIN_NAME,
  });
}

/** Converts the documented compact duration syntax into whole seconds. */
export function durationSeconds(value: string): number {
  const amount = Number.parseInt(value.slice(0, -1), 10);
  const unit = value.at(-1);
  return amount * ({ s: 1, m: 60, h: 3600, d: 86400 }[unit ?? "s"] ?? 1);
}

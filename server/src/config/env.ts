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
    SUPABASE_URL: z.url(),
    SUPABASE_SECRET_KEY: z.string().regex(/^sb_secret_.+/),
    SUPABASE_STORAGE_BUCKET: z.string().trim().min(3).max(63),
    UPLOAD_MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive(),
    USER_STORAGE_QUOTA_BYTES: z.coerce.number().int().positive(),
    UPLOAD_ALLOWED_MIME_TYPES: z.string().transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
    UPLOAD_MAX_FILES_PER_BATCH: z.coerce.number().int().positive(),
    FILE_EXTRACTION_MAX_BYTES: z.coerce.number().int().positive(),
  })
  .strict()
  .refine(
    (value) =>
      value.UPLOAD_MAX_FILE_SIZE_BYTES === 5_242_880 &&
      value.USER_STORAGE_QUOTA_BYTES === 104_857_600 &&
      value.UPLOAD_MAX_FILES_PER_BATCH === 10 &&
      value.UPLOAD_ALLOWED_MIME_TYPES.join(",") ===
        "application/pdf,text/plain,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    {
      message:
        "Phase 2 upload limits and MIME allowlist must match the approved specification",
    },
  );

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
    SUPABASE_URL: input.SUPABASE_URL,
    SUPABASE_SECRET_KEY: input.SUPABASE_SECRET_KEY,
    SUPABASE_STORAGE_BUCKET: input.SUPABASE_STORAGE_BUCKET,
    UPLOAD_MAX_FILE_SIZE_BYTES: input.UPLOAD_MAX_FILE_SIZE_BYTES,
    USER_STORAGE_QUOTA_BYTES: input.USER_STORAGE_QUOTA_BYTES,
    UPLOAD_ALLOWED_MIME_TYPES: input.UPLOAD_ALLOWED_MIME_TYPES,
    UPLOAD_MAX_FILES_PER_BATCH: input.UPLOAD_MAX_FILES_PER_BATCH,
    FILE_EXTRACTION_MAX_BYTES: input.FILE_EXTRACTION_MAX_BYTES,
  });
}

/** Converts the documented compact duration syntax into whole seconds. */
export function durationSeconds(value: string): number {
  const amount = Number.parseInt(value.slice(0, -1), 10);
  const unit = value.at(-1);
  return amount * ({ s: 1, m: 60, h: 3600, d: 86400 }[unit ?? "s"] ?? 1);
}

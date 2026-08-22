import { z } from "zod";
export const fileIdSchema = z.uuid();

const pageSizeOptions = [5, 10, 20] as const;

/** Validates the user-selectable file page-size options. */
const pageSizeSchema = z.coerce
  .number()
  .int()
  .refine(
    (value) =>
      pageSizeOptions.includes(value as (typeof pageSizeOptions)[number]),
    { message: "Page size must be one of 5, 10, or 20" },
  );

export const fileQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(200)
      .transform((value) => value || undefined)
      .optional(),
    type: z.enum(["pdf", "text", "image", "document"]).optional(),
    folderId: z.union([z.uuid(), z.literal("root")]).optional(),
    sort: z.enum(["name", "size", "uploadedAt"]).default("uploadedAt"),
    direction: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: pageSizeSchema.default(20),
  })
  .strict();

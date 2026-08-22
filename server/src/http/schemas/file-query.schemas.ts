import { z } from "zod";
export const fileIdSchema = z.uuid();
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
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

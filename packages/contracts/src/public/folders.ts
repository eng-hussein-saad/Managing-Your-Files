import { z } from "zod";
import { fileSummarySchema, folderSummarySchema } from "./files.js";

export const folderSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1).max(120),
    parentId: z.uuid().nullable(),
    depth: z.number().int().min(1).max(10),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const createFolderRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    parentId: z.uuid().nullable(),
  })
  .strict();
export const renameFolderRequestSchema = z
  .object({ name: z.string().trim().min(1).max(120) })
  .strict();
export const moveFileRequestSchema = z
  .object({ folderId: z.uuid().nullable() })
  .strict();
export const folderContentsSchema = z
  .object({
    folder: folderSchema.nullable(),
    breadcrumbs: z.array(folderSummarySchema),
    folders: z.array(folderSchema),
    files: z.array(fileSummarySchema),
  })
  .strict();
export type Folder = z.infer<typeof folderSchema>;

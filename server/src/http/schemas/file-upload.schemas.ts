import { z } from "zod";

export const maxFileSizeBytes = 5_242_880;
export const maxFilesPerBatch = 10;
export const allowedUploadMimeTypes = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export const uploadFileFieldSchema = z
  .object({ folderId: z.uuid().optional() })
  .strict();

export const allowedMimeTypes = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export type AllowedMimeType = (typeof allowedMimeTypes)[number];
export type FileTypeCategory = "pdf" | "text" | "image" | "document";
export type PreviewKind = "pdf" | "text" | "image" | "unavailable";
export type ExtractionState = "available" | "unavailable";
export interface FileRecord {
  id: string;
  ownerId: string;
  folderId: string | null;
  originalName: string;
  storageKey: string;
  mimeType: AllowedMimeType;
  size: bigint;
  extractedContent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

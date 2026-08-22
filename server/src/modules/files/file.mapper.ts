import type {
  FileRecord,
  FileTypeCategory,
  PreviewKind,
} from "./file.types.js";

/** Maps verified MIME types into the fixed public file categories. */
export function categoryForMime(
  mimeType: FileRecord["mimeType"],
): FileTypeCategory {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "text/plain") return "text";
  if (mimeType.startsWith("image/")) return "image";
  return "document";
}
/** Maps verified MIME types into preview capabilities without leaking storage references. */
export function previewForMime(mimeType: FileRecord["mimeType"]): PreviewKind {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "text/plain") return "text";
  if (mimeType.startsWith("image/")) return "image";
  return "unavailable";
}
/** Projects a persisted file to browser-safe metadata. */
export function toPublicFile(file: FileRecord) {
  return {
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    typeCategory: categoryForMime(file.mimeType),
    sizeBytes: file.size.toString(),
    folder: null,
    uploadedAt: file.createdAt.toISOString(),
    previewKind: previewForMime(file.mimeType),
    extractionState:
      file.extractedContent === null
        ? ("unavailable" as const)
        : ("available" as const),
  };
}

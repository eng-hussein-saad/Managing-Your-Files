import { expressClient } from "../../../lib/api/express-client";
import type { FileSummary, QuotaSnapshot } from "@gold-era/contracts/public";
export interface UploadPolicy {
  maxFileSizeBytes: string;
  maxFilesPerBatch: number;
  allowedMimeTypes: string[];
  quota: { usedBytes: string; remainingBytes: string; limitBytes: string };
}
export interface UploadFailure {
  message: string;
  quota?: QuotaSnapshot;
}
/** Retrieves the authoritative limits shown before browser upload. */
export async function getUploadPolicy(): Promise<UploadPolicy> {
  const response = await expressClient.get<{ data: UploadPolicy }>(
    "/api/v1/files/policy",
  );
  return response.data.data;
}
/** Uploads one browser file while forwarding Axios progress events. */
export async function uploadFile(
  file: File,
  folderId: string | null,
  onProgress?: (percent: number) => void,
): Promise<FileSummary> {
  const body = new FormData();
  body.append("file", file);
  if (folderId) body.append("folderId", folderId);
  /** Converts transport byte counts into a stable integer percentage. */ const reportProgress =
    /** Implements the local reportProgress operation. */ (event: {
      total?: number;
      loaded: number;
    }) =>
      onProgress?.(
        event.total ? Math.round((event.loaded / event.total) * 100) : 0,
      );
  const response = await expressClient.post<{ data: FileSummary }>(
    "/api/v1/files",
    body,
    { onUploadProgress: reportProgress },
  );
  return response.data.data;
}

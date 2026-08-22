import type { FileDetail, FileSummary } from "@gold-era/contracts/public";
import { expressClient } from "../../../lib/api/express-client";

export interface FileQuery {
  search?: string;
  type?: "pdf" | "text" | "image" | "document";
  folderId?: string;
  sort?: "name" | "size" | "uploadedAt";
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
export interface FilePage {
  success: true;
  data: FileSummary[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/** Requests one server-filtered file collection page. */
export async function getFiles(
  params: FileQuery,
  signal?: AbortSignal,
): Promise<FilePage> {
  const response = await expressClient.get<FilePage>("/api/v1/files", {
    params,
    signal,
  });
  return response.data;
}
/** Requests browser-safe metadata for one owned file. */
export async function getFile(
  id: string,
  signal?: AbortSignal,
): Promise<FileDetail> {
  const response = await expressClient.get<{ data: FileDetail }>(
    `/api/v1/files/${id}`,
    { signal },
  );
  return response.data.data;
}

import type { AdminFile, AdminFileDelete, AdminPageMeta } from "@gold-era/contracts/public";
import { expressClient } from "../../../lib/api/express-client";

export interface AdminFileFilters {
  search?: string;
  ownerId?: string;
  type?: "pdf" | "text" | "image" | "document";
  uploadedFrom?: string;
  minSizeBytes?: string;
  maxSizeBytes?: string;
  uploadedBefore?: string;
  folder?: "any" | "root" | "foldered";
  sort?: "name" | "owner" | "size" | "uploadedAt";
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: 5 | 10 | 20;
}

/** Requests one metadata-only global file page. */
export async function getAdminFiles(query: AdminFileFilters, signal?: AbortSignal) {
  const response = await expressClient.get<{ success: true; data: AdminFile[]; meta: AdminPageMeta }>(
    "/api/v1/admin/files",
    { params: query, signal },
  );
  return response.data;
}

/** Requests one metadata-only global file detail. */
export async function getAdminFile(id: string, signal?: AbortSignal) {
  const response = await expressClient.get<{ success: true; data: AdminFile }>(
    `/api/v1/admin/files/${id}`,
    { signal },
  );
  return response.data.data;
}

/** Permanently deletes one globally visible file after typed confirmation. */
export async function deleteAdminFile(id: string, input: AdminFileDelete) {
  await expressClient.delete(`/api/v1/admin/files/${id}`, { data: input });
}

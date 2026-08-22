import type { FileSummary, Folder } from "@gold-era/contracts/public";
import { expressClient } from "../../../lib/api/express-client";
export interface FolderContents {
  folder: Folder | null;
  breadcrumbs: Array<{ id: string; name: string }>;
  folders: Folder[];
  files: FileSummary[];
}
/** Retrieves virtual-root or owned-folder contents. */
export async function getFolderContents(
  parentId: string | null,
  signal?: AbortSignal,
): Promise<FolderContents> {
  const response = await expressClient.get<{ data: FolderContents }>(
    "/api/v1/folders",
    { params: parentId ? { parentId } : {}, signal },
  );
  return response.data.data;
}
/** Creates one owned fixed-parent folder. */
export async function createFolder(input: {
  name: string;
  parentId: string | null;
}): Promise<Folder> {
  const response = await expressClient.post<{ data: Folder }>(
    "/api/v1/folders",
    input,
  );
  return response.data.data;
}
/** Renames one owned folder without changing its parent. */
export async function renameFolder(id: string, name: string): Promise<Folder> {
  const response = await expressClient.patch<{ data: Folder }>(
    `/api/v1/folders/${id}`,
    { name },
  );
  return response.data.data;
}
/** Moves a current owned file to root or a destination folder. */
export async function moveFile(
  id: string,
  folderId: string | null,
): Promise<FileSummary> {
  const response = await expressClient.patch<{ data: FileSummary }>(
    `/api/v1/files/${id}`,
    { folderId },
  );
  return response.data.data;
}
/** Permanently removes one owned empty folder. */
export async function deleteFolder(id: string): Promise<void> {
  await expressClient.delete(`/api/v1/folders/${id}`);
}

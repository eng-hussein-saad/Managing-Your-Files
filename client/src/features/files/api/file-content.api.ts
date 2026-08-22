import { expressClient } from "../../../lib/api/express-client";
/** Fetches an authorized preview blob without persisting a provider URL. */
export async function getPreview(id: string, signal?: AbortSignal) {
  const response = await expressClient.get(`/api/v1/files/${id}/preview`, {
    responseType: "blob",
    signal,
  });
  return response.data as Blob;
}
/** Requests the server-streamed attachment blob for a current owned file. */
export async function downloadFile(id: string, signal?: AbortSignal) {
  const response = await expressClient.get(`/api/v1/files/${id}/download`, {
    responseType: "blob",
    signal,
  });
  return response.data as Blob;
}

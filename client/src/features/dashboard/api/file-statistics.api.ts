import { expressClient } from "../../../lib/api/express-client";
import type { FileStatistics } from "@gold-era/contracts/public";
/** Requests current owner-scoped statistics using the browser IANA timezone. */
export async function getFileStatistics(
  timeZone: string,
  signal?: AbortSignal,
): Promise<FileStatistics> {
  const response = await expressClient.get<{ data: FileStatistics }>(
    "/api/v1/file-statistics",
    { params: { timeZone }, signal },
  );
  return response.data.data;
}

import { useQuery } from "@tanstack/react-query";
import { getFileStatistics } from "../api/file-statistics.api";
/** Loads fresh personal file statistics in the browser's local timezone. */
export function useFileStatistics() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useQuery({
    queryKey: ["file-statistics", timeZone],
    queryFn: ({ signal }) => getFileStatistics(timeZone, signal),
  });
}

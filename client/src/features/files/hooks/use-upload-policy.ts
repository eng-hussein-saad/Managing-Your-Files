import { useQuery } from "@tanstack/react-query";
import { getUploadPolicy } from "../api/file-upload.api";
import { fileKeys } from "../query-keys";

/** Loads the server-authoritative upload limits before local file selection. */
export function useUploadPolicy() {
  return useQuery({
    queryKey: fileKeys.policy(),
    queryFn: getUploadPolicy,
    staleTime: 30_000,
  });
}

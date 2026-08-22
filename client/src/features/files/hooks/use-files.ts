import { useQuery } from "@tanstack/react-query";
import { getFile, getFiles, type FileQuery } from "../api/files.api";
import { fileKeys } from "../query-keys";
/** Loads a server-driven file collection with automatic cancellation. */
export function useFiles(params: FileQuery) {
  return useQuery({
    queryKey: fileKeys.list(params),
    queryFn:
      /** Implements the queryFn callback for this configured operation. */ ({
        signal,
      }) => getFiles(params, signal),
  });
}
/** Loads one browser-safe owned file detail. */
export function useFile(id: string | null) {
  return useQuery({
    queryKey: fileKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn:
      /** Implements the queryFn callback for this configured operation. */ ({
        signal,
      }) => getFile(id ?? "", signal),
  });
}

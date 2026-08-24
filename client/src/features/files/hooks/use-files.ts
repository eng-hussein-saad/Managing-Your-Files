import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";
import { getFile, getFiles, type FileQuery } from "../api/files.api";
import { fileKeys } from "../query-keys";
/** Loads a server-driven file collection with automatic cancellation. */
export function useFiles(params: FileQuery) {
  const deferredParams = useDeferredValue(params);
  return useQuery({
    queryKey: fileKeys.list(deferredParams),
    queryFn:
      /** Implements the queryFn callback for this configured operation. */ ({
        signal,
      }) => getFiles(deferredParams, signal),
    placeholderData: keepPreviousData,
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

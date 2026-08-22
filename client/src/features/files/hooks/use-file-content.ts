import { useQuery } from "@tanstack/react-query";
import { getPreview } from "../api/file-content.api";
/** Loads an owner-authorized preview only when a file and preview are requested. */
export function useFilePreview(id: string | null, enabled = true) {
  return useQuery({
    queryKey: ["files", "preview", id],
    enabled: Boolean(id) && enabled,
    queryFn:
      /** Implements the queryFn callback for this configured operation. */ ({
        signal,
      }) => getPreview(id ?? "", signal),
  });
}

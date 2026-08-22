import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFolder } from "../api/folders.api";
import { folderKeys } from "../query-keys";
/** Permanently removes an empty folder and refreshes dependent views only after success. */
export function useDeleteFolder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteFolder,
    onSuccess:
      /** Implements the onSuccess callback for this configured operation. */ async () => {
        await client.invalidateQueries({ queryKey: folderKeys.all });
        await client.invalidateQueries({ queryKey: ["files"] });
      },
  });
}

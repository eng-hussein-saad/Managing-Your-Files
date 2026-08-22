import { useMutation, useQueryClient } from "@tanstack/react-query";
import { expressClient } from "../../../lib/api/express-client";
/** Permanently removes a file and refreshes files, folders, quota, and statistics only on success. */
export function useDeleteFile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn:
      /** Implements the mutationFn callback for this configured operation. */ async (
        id: string,
      ) => {
        await expressClient.delete(`/api/v1/files/${id}`);
      },
    onSuccess:
      /** Implements the onSuccess callback for this configured operation. */ async () => {
        await client.invalidateQueries({ queryKey: ["files"] });
        await client.invalidateQueries({ queryKey: ["folders"] });
        await client.invalidateQueries({ queryKey: ["upload-policy"] });
        await client.invalidateQueries({ queryKey: ["file-statistics"] });
      },
  });
}

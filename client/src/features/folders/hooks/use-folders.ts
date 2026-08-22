import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFolder,
  getFolderContents,
  moveFile,
  renameFolder,
} from "../api/folders.api";
import { folderKeys } from "../query-keys";
/** Loads one root or owned-folder browser location. */
export function useFolderContents(parentId: string | null) {
  return useQuery({
    queryKey: folderKeys.contents(parentId),
    queryFn:
      /** Implements the queryFn callback for this configured operation. */ ({
        signal,
      }) => getFolderContents(parentId, signal),
  });
}
/** Exposes folder mutations that refresh dependent folder and file views. */
export function useFolderMutations() {
  const client = useQueryClient();
  /** Refreshes every location-dependent file and folder cache after mutation success. */ const refresh =
    /** Implements the local refresh operation. */ async () => {
      await client.invalidateQueries({ queryKey: folderKeys.all });
      await client.invalidateQueries({ queryKey: ["files"] });
    };
  return {
    create: useMutation({ mutationFn: createFolder, onSuccess: refresh }),
    rename: useMutation({
      mutationFn:
        /** Implements the mutationFn callback for this configured operation. */ ({
          id,
          name,
        }: {
          id: string;
          name: string;
        }) => renameFolder(id, name),
      onSuccess: refresh,
    }),
    moveFile: useMutation({
      mutationFn:
        /** Implements the mutationFn callback for this configured operation. */ ({
          id,
          folderId,
        }: {
          id: string;
          folderId: string | null;
        }) => moveFile(id, folderId),
      onSuccess: refresh,
    }),
  };
}

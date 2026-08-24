import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminFileDelete } from "@gold-era/contracts/public";
import {
  deleteAdminFile,
  getAdminFile,
  getAdminFiles,
  type AdminFileFilters,
} from "../api/admin-files.api";
import { adminKeys } from "../query-keys";

/** Loads one cancellable server-driven global file page. */
export function useAdminFiles(query: AdminFileFilters) {
  return useQuery({
    queryKey: adminKeys.fileList(query),
    queryFn: /** Requests current global metadata with cancellation. */ ({ signal }) =>
      getAdminFiles(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** Loads one metadata-only global file detail. */
export function useAdminFile(id: string | null) {
  return useQuery({
    queryKey: adminKeys.fileDetail(id ?? ""),
    enabled: Boolean(id),
    queryFn: /** Requests the selected metadata detail with cancellation. */ ({ signal }) =>
      getAdminFile(id ?? "", signal),
  });
}

/** Permanently deletes one file without retries and refreshes affected totals. */
export function useDeleteAdminFile() {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: /** Applies one confirmed global file deletion. */ (command: { id: string; input: AdminFileDelete }) =>
      deleteAdminFile(command.id, command.input),
    onSuccess: /** Removes stale detail and refreshes global files, statistics, and audit. */ async (_data, command) => {
      client.removeQueries({ queryKey: adminKeys.fileDetail(command.id) });
      await Promise.all([
        client.invalidateQueries({ queryKey: adminKeys.files() }),
        client.invalidateQueries({ queryKey: adminKeys.statistics() }),
        client.invalidateQueries({ queryKey: adminKeys.audit() }),
      ]);
    },
  });
}

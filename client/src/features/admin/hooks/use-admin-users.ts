import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminRoleChange, AdminUserDelete, AdminUserQuery } from "@gold-era/contracts/public";
import {
  changeAdminUserRole,
  deleteAdminUser,
  getAdminUser,
  getAdminUsers,
} from "../api/admin-users.api";
import { adminKeys } from "../query-keys";

/** Loads one cancellable server-driven administrator user page. */
export function useAdminUsers(query: AdminUserQuery) {
  return useQuery({
    queryKey: adminKeys.userList(query),
    queryFn: /** Requests the current normalized page with cancellation. */ ({ signal }) =>
      getAdminUsers(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** Loads one browser-safe user detail only when selected. */
export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: adminKeys.userDetail(id ?? ""),
    enabled: Boolean(id),
    queryFn: /** Requests the selected user with cancellation. */ ({ signal }) =>
      getAdminUser(id ?? "", signal),
  });
}

/** Changes a user role once and narrowly refreshes affected administrator caches. */
export function useChangeAdminUserRole() {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: /** Applies the confirmed role mutation. */ (command: { id: string; input: AdminRoleChange }) =>
      changeAdminUserRole(command.id, command.input),
    onSuccess: /** Refreshes only affected user collections, detail, and monitoring totals. */ async (user) => {
      client.setQueryData(adminKeys.userDetail(user.id), user);
      await client.invalidateQueries({ queryKey: adminKeys.users() });
      await client.invalidateQueries({ queryKey: adminKeys.statistics() });
      await client.invalidateQueries({ queryKey: adminKeys.audit() });
    },
  });
}

/** Permanently deletes a user once and refreshes affected summaries only on success. */
export function useDeleteAdminUser() {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: /** Applies the confirmed permanent user deletion. */ (command: { id: string; input: AdminUserDelete }) =>
      deleteAdminUser(command.id, command.input),
    onSuccess: /** Removes stale detail and refreshes user, file, statistics, and audit views. */ async (_data, command) => {
      client.removeQueries({ queryKey: adminKeys.userDetail(command.id) });
      await Promise.all([
        client.invalidateQueries({ queryKey: adminKeys.users() }),
        client.invalidateQueries({ queryKey: adminKeys.files() }),
        client.invalidateQueries({ queryKey: adminKeys.statistics() }),
        client.invalidateQueries({ queryKey: adminKeys.audit() }),
      ]);
    },
  });
}

import type {
  AdminRoleChange,
  AdminUser,
  AdminUserDelete,
  AdminUserQuery,
  AdminPageMeta,
} from "@gold-era/contracts/public";
import { expressClient } from "../../../lib/api/express-client";

/** Requests one server-driven administrator user page. */
export async function getAdminUsers(query: AdminUserQuery, signal?: AbortSignal) {
  const response = await expressClient.get<{ success: true; data: AdminUser[]; meta: AdminPageMeta }>(
    "/api/v1/admin/users",
    { params: query, signal },
  );
  return response.data;
}

/** Requests browser-safe metadata for one administrator-visible user. */
export async function getAdminUser(id: string, signal?: AbortSignal) {
  const response = await expressClient.get<{ success: true; data: AdminUser }>(
    `/api/v1/admin/users/${id}`,
    { signal },
  );
  return response.data.data;
}

/** Applies one optimistic-concurrency guarded role change. */
export async function changeAdminUserRole(id: string, input: AdminRoleChange) {
  const response = await expressClient.patch<{ success: true; data: AdminUser }>(
    `/api/v1/admin/users/${id}/role`,
    input,
  );
  return response.data.data;
}

/** Permanently removes one user after typed target confirmation. */
export async function deleteAdminUser(id: string, input: AdminUserDelete) {
  await expressClient.delete(`/api/v1/admin/users/${id}`, { data: input });
}

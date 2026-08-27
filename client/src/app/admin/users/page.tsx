"use client";
import type { AdminUserQuery } from "@gold-era/contracts/public";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminUserDirectory } from "../../../features/admin/components/admin-user-directory";
import { AdminPageHeader } from "../../../features/admin/components/admin-page-header";
import { useAuthState } from "../../../features/auth/auth-store";

/** Parses bounded administrator user state from the current URL. */
function userQuery(params: URLSearchParams): AdminUserQuery {
  const pageSize = Number(params.get("pageSize"));
  const sort = params.get("sort");
  const direction = params.get("direction");
  const role = params.get("role");
  return {
    search: params.get("search") || undefined,
    role: role === "USER" || role === "ADMIN" ? role : undefined,
    verified: undefined,
    sort:
      sort === "name" || sort === "role"
        ? sort
        : "createdAt",
    direction: direction === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(params.get("page")) || 1),
    pageSize: pageSize === 5 || pageSize === 10 ? pageSize : 20,
  };
}

/** Provides a URL-backed searchable user administration route. */
export default function AdminUsersPage() {
  const auth = useAuthState();
  const params = useSearchParams();
  const router = useRouter();
  const query = userQuery(new URLSearchParams(params.toString()));
  /** Replaces normalized URL state after one filter or pagination change. */
  const update = (next: Partial<AdminUserQuery>) => {
    const values = { ...query, ...next };
    const updated = new URLSearchParams();
    for (const [key, value] of Object.entries(values))
      if (value !== undefined && value !== "") updated.set(key, String(value));
    router.replace(`/admin/users?${updated.toString()}`);
  };
  return (
    <main id="main" className="app-page">
      <AdminPageHeader
        title="User directory"
        description="Search safe account metadata, manage eligible roles, or permanently remove an account and all owned state."
      />
      <AdminUserDirectory
        query={query}
        update={update}
        currentUserId={auth.session?.user.id}
      />
    </main>
  );
}

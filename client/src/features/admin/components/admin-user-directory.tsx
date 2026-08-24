"use client";
import type { AdminUserQuery } from "@gold-era/contracts/public";
import { ErrorPanel } from "../../../components/status/error-panel";
import { formatDate, formatPage } from "../../../lib/presentation/format";
import { useAdminUsers } from "../hooks/use-admin-users";
import { AdminUserActions } from "./admin-user-actions";

/** Renders the server-driven searchable administrator user directory. */
export function AdminUserDirectory({ query, update }: { query: AdminUserQuery; update: (next: Partial<AdminUserQuery>) => void }) {
  const users = useAdminUsers(query);
  if (users.isLoading) return <p role="status" aria-busy="true">Loading users…</p>;
  if (users.error)
    return <ErrorPanel message="Users could not be loaded." retry={() => void users.refetch()} />;
  const page = users.data;
  return (
    <section className="admin-directory" aria-label="User administration">
      <div className="admin-toolbar">
        <label>Search users<input value={query.search ?? ""} onChange={(event) => update({ search: event.target.value || undefined, page: 1 })} /></label>
        <label>Role<select value={query.role ?? ""} onChange={(event) => update({ role: (event.target.value || undefined) as AdminUserQuery["role"], page: 1 })}><option value="">All</option><option value="USER">User</option><option value="ADMIN">Administrator</option></select></label>
        <label>Sort<select value={query.sort} onChange={(event) => update({ sort: event.target.value as AdminUserQuery["sort"], page: 1 })}><option value="createdAt">Created</option><option value="name">Name</option><option value="email">Email</option><option value="role">Role</option></select></label>
      </div>
      {!page?.data.length ? <p className="collection-empty">No users match these filters.</p> : (
        <div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead><tbody>
          {page.data.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{formatDate(user.createdAt)}</td><td><AdminUserActions user={user} onStale={() => void users.refetch()} /></td></tr>)}
        </tbody></table></div>
      )}
      <nav className="file-pagination" aria-label="User pages"><button disabled={query.page <= 1} onClick={() => update({ page: query.page - 1 })}>Previous</button><span>{formatPage(query.page, page?.meta.totalPages ?? 0)}</span><button disabled={!page || query.page >= page.meta.totalPages} onClick={() => update({ page: query.page + 1 })}>Next</button></nav>
    </section>
  );
}

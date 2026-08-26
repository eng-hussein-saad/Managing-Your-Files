"use client";
import type { AdminUserQuery } from "@gold-era/contracts/public";
import { ErrorPanel } from "../../../components/status/error-panel";
import { formatDate, formatPage } from "../../../lib/presentation/format";
import { useAdminUsers } from "../hooks/use-admin-users";
import { AdminUserActions } from "./admin-user-actions";
import { Skeleton } from "../../../components/ui/surfaces";

/** Renders the server-driven searchable administrator user directory. */
export function AdminUserDirectory({
  query,
  update,
  currentUserId,
}: {
  query: AdminUserQuery;
  update: (next: Partial<AdminUserQuery>) => void;
  currentUserId?: string;
}) {
  const users = useAdminUsers(query);
  if (users.isLoading)
    return <Skeleton label="Loading users" lines={6} />;
  if (users.error)
    return (
      <ErrorPanel
        message="Users could not be loaded."
        retry={() => void users.refetch()}
      />
    );
  const page = users.data;
  return (
    <section className="admin-directory" aria-label="User administration">
      <div className="admin-toolbar">
        <label className="admin-search">
          <span className="sr-only">Search users</span>
          <input
            aria-label="Search users"
            placeholder="Search name or email"
            maxLength={200}
            value={query.search ?? ""}
            onChange={(event) =>
              update({ search: event.target.value || undefined, page: 1 })
            }
          />
        </label>
        <label>
          <span className="sr-only">Role</span>
          <select
            aria-label="Role"
            value={query.role ?? ""}
            onChange={(event) =>
              update({
                role: (event.target.value ||
                  undefined) as AdminUserQuery["role"],
                page: 1,
              })
            }
          >
            <option value="">All roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sort users</span>
          <select
            aria-label="Sort users"
            value={query.sort}
            onChange={(event) =>
              update({
                sort: event.target.value as AdminUserQuery["sort"],
                page: 1,
              })
            }
          >
            <option value="createdAt">Newest first</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="role">Role</option>
          </select>
        </label>
      </div>
      {!page?.data.length ? (
        <p className="collection-empty">No users match these filters.</p>
      ) : (
        <div
          className="table-scroll ui-local-scroll"
          role="region"
          aria-label="User directory table"
          tabIndex={0}
        >
          <table className="ui-table admin-table">
            <caption className="sr-only">User directory</caption>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {page.data.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>
                    <span
                      className={`ui-pill ${user.role === "ADMIN" ? "warning" : "neutral"}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    {user.id === currentUserId ? (
                      <span className="ui-pill neutral">Current account</span>
                    ) : (
                      <AdminUserActions
                        user={user}
                        onStale={() => void users.refetch()}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <nav className="file-pagination ui-pagination" aria-label="User pages">
        <button
          className="ui-button secondary"
          disabled={query.page <= 1}
          onClick={() => update({ page: query.page - 1 })}
        >
          Previous
        </button>
        <span aria-live="polite">
          {formatPage(query.page, page?.meta.totalPages ?? 0)}
        </span>
        <button
          className="ui-button secondary"
          disabled={!page || query.page >= page.meta.totalPages}
          onClick={() => update({ page: query.page + 1 })}
        >
          Next
        </button>
      </nav>
    </section>
  );
}

"use client";
import type { AdminAuditQuery } from "@gold-era/contracts/public";
import { ErrorPanel } from "../../../components/status/error-panel";
import { formatDate, formatPage } from "../../../lib/presentation/format";
import { useAdminAuditEvents } from "../hooks/use-admin-monitoring";

/** Renders searchable sanitized audit history with safe actor states. */
export function AdminAuditHistory({
  query,
  update,
}: {
  query: AdminAuditQuery;
  update: (next: Partial<AdminAuditQuery>) => void;
}) {
  const audit = useAdminAuditEvents(query);
  if (audit.isLoading)
    return (
      <p role="status" aria-busy="true">
        Loading audit history…
      </p>
    );
  if (audit.error)
    return (
      <ErrorPanel
        message="Audit history could not be loaded."
        retry={() => void audit.refetch()}
      />
    );
  const page = audit.data;
  return (
    <section className="admin-directory" aria-label="Audit history">
      <div className="admin-toolbar">
        <label className="admin-search">
          <span className="sr-only">Search audit history</span>
          <input
            aria-label="Search audit history"
            placeholder="Search action or target"
            maxLength={200}
            value={query.search ?? ""}
            onChange={(event) =>
              update({ search: event.target.value || undefined, page: 1 })
            }
          />
        </label>
        <label>
          <span className="sr-only">Outcome</span>
          <select
            aria-label="Outcome"
            value={query.outcome ?? ""}
            onChange={(event) =>
              update({
                outcome: (event.target.value ||
                  undefined) as AdminAuditQuery["outcome"],
                page: 1,
              })
            }
          >
            <option value="">All outcomes</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
            <option value="DENIED">DENIED</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Actor</span>
          <select
            aria-label="Actor"
            value={query.actorState ?? ""}
            onChange={(event) =>
              update({
                actorState: (event.target.value ||
                  undefined) as AdminAuditQuery["actorState"],
                page: 1,
              })
            }
          >
            <option value="">All actors</option>
            <option value="user">Current user</option>
            <option value="deleted">Deleted user</option>
            <option value="system">System</option>
          </select>
        </label>
      </div>
      {!page?.data.length ? (
        <p className="collection-empty">No audit events match these filters.</p>
      ) : (
        <div
          className="table-scroll ui-local-scroll"
          role="region"
          aria-label="Sanitized audit history table"
          tabIndex={0}
        >
          <table className="ui-table admin-table">
            <caption className="sr-only">Sanitized audit history</caption>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {page.data.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.createdAt)}</td>
                  <td>
                    {event.actor.kind === "user"
                      ? event.actor.name
                      : event.actor.label}
                  </td>
                  <td>{event.action}</td>
                  <td>{event.entityType ?? "—"}</td>
                  <td>
                    <span
                      className={`ui-pill ${event.metadata.outcome === "SUCCESS" ? "success" : event.metadata.outcome === "DENIED" || event.metadata.outcome === "FAILURE" ? "danger" : "neutral"}`}
                    >
                      {event.metadata.outcome ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <nav className="file-pagination ui-pagination" aria-label="Audit pages">
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

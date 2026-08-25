"use client";
import { ErrorPanel } from "../../../components/status/error-panel";
import {
  formatBytes,
  formatDate,
  formatPage,
} from "../../../lib/presentation/format";
import type { AdminFileFilters } from "../api/admin-files.api";
import { useAdminFiles } from "../hooks/use-admin-files";
import { AdminFileActions } from "./admin-file-actions";

/** Renders searchable metadata-only files across every current owner. */
export function AdminFileDirectory({
  query,
  update,
}: {
  query: AdminFileFilters & {
    page: number;
    pageSize: 5 | 10 | 20;
    sort: NonNullable<AdminFileFilters["sort"]>;
    direction: NonNullable<AdminFileFilters["direction"]>;
    folder: NonNullable<AdminFileFilters["folder"]>;
  };
  update: (next: Partial<AdminFileFilters>) => void;
}) {
  const files = useAdminFiles(query);
  if (files.isLoading)
    return (
      <p role="status" aria-busy="true">
        Loading global file metadata…
      </p>
    );
  if (files.error)
    return (
      <ErrorPanel
        message="Global file metadata could not be loaded."
        retry={() => void files.refetch()}
      />
    );
  const page = files.data;
  return (
    <section
      className="admin-directory"
      aria-label="Global file administration"
    >
      <div className="admin-toolbar">
        <label className="admin-search">
          <span className="sr-only">Search global files</span>
          <input
            aria-label="Search global files"
            placeholder="Search filename or owner"
            maxLength={200}
            value={query.search ?? ""}
            onChange={(event) =>
              update({ search: event.target.value || undefined, page: 1 })
            }
          />
        </label>
        <label>
          <span className="sr-only">File type</span>
          <select
            aria-label="File type"
            value={query.type ?? ""}
            onChange={(event) =>
              update({
                type: (event.target.value ||
                  undefined) as AdminFileFilters["type"],
                page: 1,
              })
            }
          >
            <option value="">All types</option>
            <option value="pdf">PDF</option>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="document">Document</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Folder location</span>
          <select
            aria-label="Folder location"
            value={query.folder}
            onChange={(event) =>
              update({
                folder: event.target.value as AdminFileFilters["folder"],
                page: 1,
              })
            }
          >
            <option value="any">Any folder</option>
            <option value="root">Root</option>
            <option value="foldered">In folder</option>
          </select>
        </label>
      </div>
      {!page?.data.length ? (
        <p className="collection-empty">No files match these filters.</p>
      ) : (
        <div
          className="table-scroll ui-local-scroll"
          role="region"
          aria-label="Global file metadata table"
          tabIndex={0}
        >
          <table className="ui-table admin-table">
            <caption className="sr-only">Global file metadata</caption>
            <thead>
              <tr>
                <th>File</th>
                <th>Owner</th>
                <th>Type / size</th>
                <th>Uploaded</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {page.data.map((file) => (
                <tr key={file.id}>
                  <td>
                    <strong>{file.originalName}</strong>
                  </td>
                  <td>
                    {file.owner.name}
                    <small>{file.owner.email}</small>
                  </td>
                  <td>
                    {file.type} · {formatBytes(file.sizeBytes)}
                  </td>
                  <td>{formatDate(file.uploadedAt)}</td>
                  <td>
                    <AdminFileActions
                      file={file}
                      onStale={() => void files.refetch()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <nav
        className="file-pagination ui-pagination"
        aria-label="Global file pages"
      >
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

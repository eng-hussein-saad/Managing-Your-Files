"use client";
import { ErrorPanel } from "../../../components/status/error-panel";
import { formatBytes, formatDate, formatPage } from "../../../lib/presentation/format";
import type { AdminFileFilters } from "../api/admin-files.api";
import { useAdminFiles } from "../hooks/use-admin-files";
import { AdminFileActions } from "./admin-file-actions";

/** Renders searchable metadata-only files across every current owner. */
export function AdminFileDirectory({ query, update }: { query: AdminFileFilters & { page: number; pageSize: 5 | 10 | 20; sort: NonNullable<AdminFileFilters["sort"]>; direction: NonNullable<AdminFileFilters["direction"]>; folder: NonNullable<AdminFileFilters["folder"]> }; update: (next: Partial<AdminFileFilters>) => void }) {
  const files = useAdminFiles(query);
  if (files.isLoading) return <p role="status" aria-busy="true">Loading global file metadata…</p>;
  if (files.error) return <ErrorPanel message="Global file metadata could not be loaded." retry={() => void files.refetch()} />;
  const page = files.data;
  return <section className="admin-directory" aria-label="Global file administration">
    <div className="admin-toolbar">
      <label>Search files<input value={query.search ?? ""} onChange={(event) => update({ search: event.target.value || undefined, page: 1 })} /></label>
      <label>Type<select value={query.type ?? ""} onChange={(event) => update({ type: (event.target.value || undefined) as AdminFileFilters["type"], page: 1 })}><option value="">All</option><option value="pdf">PDF</option><option value="text">Text</option><option value="image">Image</option><option value="document">Document</option></select></label>
      <label>Folder<select value={query.folder} onChange={(event) => update({ folder: event.target.value as AdminFileFilters["folder"], page: 1 })}><option value="any">Any</option><option value="root">Root</option><option value="foldered">In folder</option></select></label>
      <label>Sort<select value={query.sort} onChange={(event) => update({ sort: event.target.value as AdminFileFilters["sort"], page: 1 })}><option value="uploadedAt">Uploaded</option><option value="name">Name</option><option value="owner">Owner</option><option value="size">Size</option></select></label>
    </div>
    {!page?.data.length ? <p className="collection-empty">No files match these filters.</p> : <div className="table-scroll"><table><thead><tr><th>File</th><th>Owner</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr></thead><tbody>{page.data.map((file) => <tr key={file.id}><td>{file.originalName}</td><td>{file.owner.name}<small>{file.owner.email}</small></td><td>{file.type}</td><td>{formatBytes(file.sizeBytes)}</td><td>{formatDate(file.uploadedAt)}</td><td><AdminFileActions file={file} onStale={() => void files.refetch()} /></td></tr>)}</tbody></table></div>}
    <nav className="file-pagination" aria-label="Global file pages"><button disabled={query.page <= 1} onClick={() => update({ page: query.page - 1 })}>Previous</button><span>{formatPage(query.page, page?.meta.totalPages ?? 0)}</span><button disabled={!page || query.page >= page.meta.totalPages} onClick={() => update({ page: query.page + 1 })}>Next</button></nav>
  </section>;
}

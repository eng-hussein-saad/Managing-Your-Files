import type { FileSummary } from "@gold-era/contracts/public";
/** Displays responsive browser-safe summaries or distinct empty/no-match states. */
export function FileCollection({
  files,
  view,
  hasFilters,
  onSelect,
}: {
  files: FileSummary[];
  view: "list" | "grid";
  hasFilters: boolean;
  onSelect: (id: string) => void;
}) {
  if (!files.length)
    return (
      <div className="collection-empty">
        <span aria-hidden="true">{hasFilters ? "⌕" : "+"}</span>
        <h3>{hasFilters ? "Nothing found" : "Your archive is ready"}</h3>
        <p>
          {hasFilters
            ? "No files match these filters."
            : "You have no files yet. Add your first one above."}
        </p>
      </div>
    );
  return (
    <>
      {view === "list" ? (
        <div className="file-list-header" aria-hidden="true">
          <span>Name</span>
          <span>Location</span>
          <span>Uploaded</span>
          <span />
        </div>
      ) : null}
      <ul
        data-view={view}
        aria-label="File collection"
        className={view === "grid" ? "file-grid" : "file-list"}
      >
        {files.map(
          /** Maps one source item into its derived public representation. */ (
            file,
          ) => (
            <li key={file.id}>
              <button
                type="button"
                onClick={
                  /** Handles the bound UI event or state projection for this JSX control. */ () =>
                    onSelect(file.id)
                }
              >
                <span
                  className="file-kind"
                  data-kind={file.typeCategory}
                  aria-hidden="true"
                >
                  {file.typeCategory.slice(0, 3)}
                </span>
                <span className="file-summary">
                  <strong title={file.originalName}>{file.originalName}</strong>
                  <small>
                    {file.typeCategory} · {formatFileSize(file.sizeBytes)}
                  </small>
                </span>
                <span className="file-location">
                  {file.folder?.name ?? "My Files"}
                </span>
                <span className="file-date">
                  {new Date(file.uploadedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="file-open" aria-hidden="true">
                  →
                </span>
              </button>
            </li>
          ),
        )}
      </ul>
    </>
  );
}

/** Converts the API byte string into a compact browser-friendly label. */
function formatFileSize(value: string) {
  const bytes = Number(value);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

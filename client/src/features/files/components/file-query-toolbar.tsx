import type { FileQuery } from "../api/files.api";
/** Renders controlled server-side search, type, sorting, and view controls. */
export function FileQueryToolbar({
  query,
  view,
  onChange,
  onView,
}: {
  query: FileQuery;
  view: "list" | "grid";
  onChange: (change: Partial<FileQuery>) => void;
  onView: (view: "list" | "grid") => void;
}) {
  return (
    <section className="file-toolbar" aria-label="File filters">
      <label className="search-field">
        <span className="sr-only">Search files</span><span aria-hidden="true">⌕</span>
        <input
          placeholder="Search your archive"
          value={query.search ?? ""}
          maxLength={200}
          onChange={
            /** Handles the bound UI event or state projection for this JSX control. */ (
              event,
            ) => onChange({ search: event.target.value, page: 1 })
          }
        />
      </label>
      <label><span>Type</span>
        <select
          value={query.type ?? ""}
          onChange={
            /** Handles the bound UI event or state projection for this JSX control. */ (
              event,
            ) =>
              onChange({
                type: event.target.value
                  ? (event.target.value as FileQuery["type"])
                  : undefined,
                page: 1,
              })
          }
        >
          <option value="">All types</option>
          <option value="pdf">PDF</option>
          <option value="text">Text</option>
          <option value="image">Images</option>
          <option value="document">Documents</option>
        </select>
      </label>
      <label><span>Sort by</span>
        <select
          value={query.sort ?? "uploadedAt"}
          onChange={
            /** Handles the bound UI event or state projection for this JSX control. */ (
              event,
            ) =>
              onChange({
                sort: event.target.value as FileQuery["sort"],
                page: 1,
              })
          }
        >
          <option value="uploadedAt">Uploaded</option>
          <option value="name">Name</option>
          <option value="size">Size</option>
        </select>
      </label>
      <label className="direction-field"><span>Order</span>
        <select
          value={query.direction ?? "desc"}
          onChange={
            /** Handles the bound UI event or state projection for this JSX control. */ (
              event,
            ) =>
              onChange({
                direction: event.target.value as FileQuery["direction"],
                page: 1,
              })
          }
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </label>
      <div className="view-switch" role="group" aria-label="File view">
        <button
          type="button"
          aria-pressed={view === "list"}
          onClick={
            /** Handles the bound UI event or state projection for this JSX control. */ () =>
              onView("list")
          }
        >
          <span aria-hidden="true">☷</span><span className="sr-only">List</span>
        </button>
        <button
          type="button"
          aria-pressed={view === "grid"}
          onClick={
            /** Handles the bound UI event or state projection for this JSX control. */ () =>
              onView("grid")
          }
        >
          <span aria-hidden="true">⊞</span><span className="sr-only">Grid</span>
        </button>
      </div>
    </section>
  );
}

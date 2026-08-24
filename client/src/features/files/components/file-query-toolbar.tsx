"use client";
import { useEffect, useState } from "react";
import type { FileQuery } from "../api/files.api";

type FileQueryToolbarProps = {
  query: FileQuery;
  view: "list" | "grid";
  onChange: (change: Partial<FileQuery>) => void;
  onView: (view: "list" | "grid") => void;
};

/** Renders responsive server-side search, filters, sorting, and view controls. */
export function FileQueryToolbar({
  query,
  view,
  onChange,
  onView,
}: FileQueryToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(
    /** Keeps the responsive filter drawer dismissible by keyboard. */ () => {
    if (!filtersOpen) return;
    /** Closes the filter drawer when Escape is pressed. */
    const closeOnEscape = /** Implements the local closeOnEscape operation. */ (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return /** Removes the temporary drawer keyboard listener. */ () =>
      document.removeEventListener("keydown", closeOnEscape);
  }, [filtersOpen]);

  return (
    <>
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
      <FilterControls query={query} onChange={onChange} />
      <button
        className="filter-trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={filtersOpen}
        onClick={/** Opens the responsive filter drawer. */ () => setFiltersOpen(true)}
      >
        Filters
      </button>
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
      {filtersOpen ? (
        <div
          className="filter-drawer-overlay"
          role="presentation"
          onMouseDown={/** Dismisses the drawer only from its backdrop. */ (event) => {
            if (event.target === event.currentTarget) setFiltersOpen(false);
          }}
        >
          <aside
            className="filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="file-filter-drawer-title"
          >
            <div className="filter-drawer-header">
              <div>
                <span className="eyebrow">Refine your archive</span>
                <h2 id="file-filter-drawer-title">Filters</h2>
              </div>
              <button
                className="drawer-close"
                type="button"
                aria-label="Close filters"
                onClick={/** Closes the responsive filter drawer. */ () => setFiltersOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="filter-drawer-fields">
              <label>
                <span>Search files</span>
                <input
                  placeholder="Search your archive"
                  value={query.search ?? ""}
                  maxLength={200}
                  onChange={/** Updates drawer search state at the first page. */ (event) =>
                    onChange({ search: event.target.value, page: 1 })
                  }
                />
              </label>
              <FilterControls query={query} onChange={onChange} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

/** Renders the shared filter fields for inline and drawer presentations. */
function FilterControls({
  query,
  onChange,
}: Pick<FileQueryToolbarProps, "query" | "onChange">) {
  return (
    <>
      <label>
        <span>Type</span>
        <select
          value={query.type ?? ""}
          onChange={/** Updates the selected file type at the first page. */ (event) =>
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
      <label>
        <span>Sort by</span>
        <select
          value={query.sort ?? "uploadedAt"}
          onChange={/** Updates the selected file sort at the first page. */ (event) =>
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
      <label className="direction-field">
        <span>Order</span>
        <select
          value={query.direction ?? "desc"}
          onChange={/** Updates the selected sort direction at the first page. */ (event) =>
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
      <label className="page-size-field">
        <span>Files per page</span>
        <select
          value={query.pageSize ?? 20}
          onChange={/** Updates the selected page size and returns to page one. */ (event) =>
            onChange({ pageSize: Number(event.target.value), page: 1 })
          }
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
        </select>
      </label>
    </>
  );
}

"use client";
import { useState } from "react";
import type { FileQuery } from "../api/files.api";
import {
  FilterIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
} from "../../../components/ui/icons";
import { Dialog } from "../../../components/overlays/overlay";

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
  const [draft, setDraft] = useState<FileQuery>(query);

  const openFilters =
    /** Opens the centered filter dialog with a fresh copy of the active query. */ () => {
      setDraft(query);
      setFiltersOpen(true);
    };

  const applyFilters =
    /** Commits all modal filter choices together and returns to the first page. */ () => {
      onChange({
        type: draft.type,
        sort: draft.sort,
        direction: draft.direction,
        pageSize: draft.pageSize,
        page: 1,
      });
      setFiltersOpen(false);
    };

  return (
    <>
      <section
        className="file-toolbar ui-collection-toolbar"
        aria-label="File filters"
      >
        <label className="search-field">
          <span className="sr-only">Search files</span>
          <SearchIcon />
          <input
            placeholder="Search this location"
            value={query.search ?? ""}
            maxLength={200}
            onChange={
              /** Handles the bound UI event or state projection for this JSX control. */ (
                event,
              ) => onChange({ search: event.target.value, page: 1 })
            }
          />
        </label>
        <label className="toolbar-type">
          <span className="sr-only">File type</span>
          <select
            value={query.type ?? ""}
            onChange={
              /** Applies the reference toolbar's primary type filter at page one. */ (
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
        <button
          className="filter-trigger"
          type="button"
          aria-label="More filters"
          aria-haspopup="dialog"
          aria-expanded={filtersOpen}
          onClick={openFilters}
        >
          <FilterIcon />
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
            <ListIcon />
            <span className="sr-only">List</span>
          </button>
          <button
            type="button"
            aria-pressed={view === "grid"}
            onClick={
              /** Handles the bound UI event or state projection for this JSX control. */ () =>
                onView("grid")
            }
          >
            <GridIcon />
            <span className="sr-only">Grid</span>
          </button>
        </div>
      </section>
      <Dialog
        open={filtersOpen}
        title="Filter files"
        description="Changes apply together and return the collection to page 1."
        onClose={
          /** Discards uncommitted filter changes on Escape, backdrop, or Cancel. */ () =>
            setFiltersOpen(false)
        }
        backdropTestId="file-filter-backdrop"
      >
        <div className="filter-modal-fields">
          <FilterControls
            query={draft}
            onChange={
              /** Merges one field into the modal draft without querying prematurely. */ (
                change,
              ) =>
                setDraft(
                  /** Preserves untouched modal fields while updating the selected control. */ (
                    current,
                  ) => ({ ...current, ...change }),
                )
            }
          />
        </div>
        <div className="filter-modal-actions">
          <button
            className="ui-button secondary"
            type="button"
            onClick={
              /** Closes the modal without applying its draft values. */ () =>
                setFiltersOpen(false)
            }
          >
            Cancel
          </button>
          <button
            className="ui-button primary"
            type="button"
            onClick={applyFilters}
          >
            Apply filters
          </button>
        </div>
      </Dialog>
    </>
  );
}

/** Renders the reference modal's server-backed filter fields. */
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
          onChange={
            /** Updates the selected file type at the first page. */ (event) =>
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
          onChange={
            /** Updates the selected file sort at the first page. */ (event) =>
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
          onChange={
            /** Updates the selected sort direction at the first page. */ (
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
      <label className="page-size-field">
        <span>Files per page</span>
        <select
          value={query.pageSize ?? 20}
          onChange={
            /** Updates the selected page size and returns to page one. */ (
              event,
            ) => onChange({ pageSize: Number(event.target.value), page: 1 })
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

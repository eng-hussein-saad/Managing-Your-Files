import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from "react";
import { ChevronLeftIcon, ChevronRightIcon, GridIcon, ListIcon } from "./icons";
import { IconButton } from "./controls";

/** Wraps a native table without weakening its caption or cell semantics. */
export function ResponsiveTable({
  caption,
  className = "",
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & {
  caption: string;
  children: ReactNode;
}) {
  return (
    <table className={`ui-table ${className}`.trim()} {...props}>
      <caption>{caption}</caption>
      {children}
    </table>
  );
}

/** Contains intentionally wide data locally and exposes it to keyboard scrolling. */
export function LocalScrollRegion({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`ui-local-scroll ${className}`.trim()}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

/** Groups collection search, filters, sorting, and display actions. */
export function CollectionToolbar({
  ariaLabel,
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`ui-collection-toolbar ${className}`.trim()}
      role="toolbar"
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </div>
  );
}

/** Toggles only the local presentation of an unchanged server result set. */
export function ViewToggle({
  value,
  onChange,
}: {
  value: "list" | "grid";
  onChange: (value: "list" | "grid") => void;
}) {
  return (
    <div className="ui-view-toggle" role="group" aria-label="Collection view">
      <IconButton
        label="List view"
        aria-pressed={value === "list"}
        onClick={/** Selects the list representation. */ () => onChange("list")}
      >
        <ListIcon />
      </IconButton>
      <IconButton
        label="Grid view"
        aria-pressed={value === "grid"}
        onClick={/** Selects the grid representation. */ () => onChange("grid")}
      >
        <GridIcon />
      </IconButton>
    </div>
  );
}

/** Navigates a bounded server-driven page set with explicit accessible names. */
export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const lastPage = Math.max(1, totalPages);
  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <IconButton
        label="Previous page"
        disabled={page <= 1}
        onClick={
          /** Requests the preceding server page. */ () => onPage(page - 1)
        }
      >
        <ChevronLeftIcon />
      </IconButton>
      <span>
        Page {page} of {totalPages}
      </span>
      <IconButton
        label="Next page"
        disabled={totalPages === 0 || page >= lastPage}
        onClick={
          /** Requests the following server page. */ () => onPage(page + 1)
        }
      >
        <ChevronRightIcon />
      </IconButton>
    </nav>
  );
}

/** Renders bounded page navigation for server-driven collections. */
export function FilePagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  return (
    <nav className="file-pagination ui-pagination" aria-label="File pages">
      <button
        type="button"
        disabled={page <= 1}
        onClick={
          /** Handles the bound UI event or state projection for this JSX control. */ () =>
            onPage(page - 1)
        }
      >
        Previous
      </button>
      <span aria-live="polite">
        Page {page} of {Math.max(totalPages, 1)}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={
          /** Handles the bound UI event or state projection for this JSX control. */ () =>
            onPage(page + 1)
        }
      >
        Next
      </button>
    </nav>
  );
}

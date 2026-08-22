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
      <p>
        {hasFilters
          ? "No files match these filters."
          : "You have no files yet."}
      </p>
    );
  return (
    <ul
      data-view={view}
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
              <strong>{file.originalName}</strong>
              <span>
                {file.typeCategory} · {file.sizeBytes} bytes
              </span>
              <span>{file.folder?.name ?? "My Files"}</span>
            </button>
          </li>
        ),
      )}
    </ul>
  );
}

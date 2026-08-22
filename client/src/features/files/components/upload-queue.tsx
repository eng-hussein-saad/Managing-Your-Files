import type { QueueItem } from "../upload/upload.types";
/** Announces per-file upload progress and retryable outcomes. */
export function UploadQueue({
  items,
  onRetry,
}: {
  items: QueueItem[];
  onRetry?: (id: string) => void;
}) {
  return (
    <ul aria-live="polite" aria-label="Upload queue">
      {items.map(
        /** Maps one source item into its derived public representation. */ (
          item,
        ) => (
          <li key={item.id}>
            <span>
              {item.file.name}: {item.status}{" "}
              {item.status === "uploading"
                ? `${item.progress}%`
                : (item.error ?? "")}
            </span>
            {item.quota ? (
              <span> {item.quota.remainingBytes} bytes remaining.</span>
            ) : null}
            {item.status === "error" && onRetry ? (
              <button
                type="button"
                onClick={
                  /** Handles the bound UI event or state projection for this JSX control. */ () =>
                    onRetry(item.id)
                }
              >
                Retry {item.file.name}
              </button>
            ) : null}
          </li>
        ),
      )}
    </ul>
  );
}

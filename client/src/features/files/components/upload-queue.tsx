import { AlertIcon, CheckIcon, FileIcon } from "../../../components/ui/icons";
import type { QueueItem } from "../upload/upload.types";

const statusLabels: Record<QueueItem["status"], string> = {
  pending: "Ready",
  uploading: "Uploading",
  success: "Complete",
  error: "Needs attention",
};

/** Formats file sizes without making small files disappear into a zero value. */
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Announces per-file upload progress and retryable outcomes. */
export function UploadQueue({
  items,
  onRetry,
}: {
  items: QueueItem[];
  onRetry?: (id: string) => void;
}) {
  return (
    <ul className="upload-queue" aria-live="polite" aria-label="Upload queue">
      {items.map((item) => {
        const visibleProgress = item.status === "success" ? 100 : item.progress;

        return (
          <li
            className="upload-queue-item"
            data-state={item.status}
            key={item.id}
          >
            <span className="upload-file-icon" aria-hidden="true">
              {item.status === "success" ? (
                <CheckIcon />
              ) : item.status === "error" ? (
                <AlertIcon />
              ) : (
                <FileIcon />
              )}
            </span>
            <div className="upload-file-content">
              <div className="upload-file-heading">
                <div className="upload-file-name">
                  <strong title={item.file.name}>{item.file.name}</strong>
                  <small>{formatFileSize(item.file.size)}</small>
                </div>
                <span className="upload-status" data-state={item.status}>
                  {item.status === "uploading" ? (
                    <i className="upload-status-pulse" aria-hidden="true" />
                  ) : null}
                  {statusLabels[item.status]}
                  {item.status === "uploading" ? ` · ${visibleProgress}%` : ""}
                </span>
              </div>

              <span className="sr-only" data-status={item.status}>
                {item.file.name}: {item.status}{" "}
                {item.status === "uploading"
                  ? `${visibleProgress}%`
                  : (item.error ?? "")}
              </span>

              {item.status === "uploading" || item.status === "success" ? (
                <div className="upload-progress-row">
                  <progress
                    aria-label={`Upload progress for ${item.file.name}`}
                    max={100}
                    value={visibleProgress}
                  />
                </div>
              ) : null}

              {item.status === "error" ? (
                <div className="upload-error-detail">
                  <p>{item.error ?? "Upload failed. Retry this file."}</p>
                  {onRetry ? (
                    <button
                      className="upload-retry"
                      type="button"
                      onClick={() => onRetry(item.id)}
                    >
                      Retry <span className="sr-only">{item.file.name}</span>
                    </button>
                  ) : null}
                </div>
              ) : null}

              {item.quota ? (
                <small className="upload-quota">
                  {item.quota.remainingBytes} bytes remaining.
                </small>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

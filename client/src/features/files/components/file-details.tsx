"use client";
import type { FileDetail } from "@gold-era/contracts/public";
import { useState } from "react";
import { PermanentDeleteDialog } from "../../../components/confirmation/permanent-delete-dialog";
import { useDeleteFile } from "../hooks/use-delete-file";
import { FileDownload } from "./file-download";
import { FilePreview } from "./file-preview";

/** Shows complete public metadata, extraction state, and owned-content actions. */
export function FileDetails({
  file,
  onMove,
  onDeleted,
}: {
  file: FileDetail;
  onMove?: () => void;
  onDeleted?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const deletion = useDeleteFile();
  /** Confirms permanent deletion and closes details only after success. */ const remove =
    /** Implements the local remove operation. */ () =>
      deletion.mutate(file.id, {
        onSuccess:
          /** Implements the onSuccess callback for this configured operation. */ () => {
            setConfirming(false);
            onDeleted?.();
          },
      });
  return (
    <aside aria-label="File details">
      <h2>{file.originalName}</h2>
      <dl>
        <dt>Type</dt>
        <dd>{file.mimeType}</dd>
        <dt>Size</dt>
        <dd>{file.sizeBytes} bytes</dd>
        <dt>Location</dt>
        <dd>
          {file.folderPath.length
            ? file.folderPath
                .map(
                  /** Maps one source item into its derived public representation. */ (
                    folder,
                  ) => folder.name,
                )
                .join(" / ")
            : "My Files"}
        </dd>
        <dt>Uploaded</dt>
        <dd>{new Date(file.uploadedAt).toLocaleString()}</dd>
        <dt>Extraction</dt>
        <dd>{file.extractionState}</dd>
      </dl>
      <FilePreview
        id={file.id}
        mimeType={file.mimeType}
        kind={file.previewKind}
      />
      {file.extractionState === "available" ? (
        <pre aria-label="Extracted content">{file.extractedContent}</pre>
      ) : (
        <p>Extracted content is unavailable.</p>
      )}
      <FileDownload id={file.id} name={file.originalName} />
      {onMove ? (
        <button type="button" onClick={onMove}>
          Move file
        </button>
      ) : null}
      <button
        type="button"
        onClick={
          /** Handles the bound UI event or state projection for this JSX control. */ () =>
            setConfirming(true)
        }
      >
        Delete file
      </button>
      <PermanentDeleteDialog
        open={confirming}
        subject={file.originalName}
        pending={deletion.isPending}
        error={
          deletion.isError
            ? "Deletion did not complete. Retry safely."
            : undefined
        }
        onCancel={
          /** Handles the bound UI event or state projection for this JSX control. */ () =>
            setConfirming(false)
        }
        onConfirm={remove}
      />
    </aside>
  );
}

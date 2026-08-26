"use client";
import type { ChangeEvent, DragEvent } from "react";
/** Provides keyboard-accessible picker and drag/drop file selection. */
export function UploadDropzone({
  onFiles,
  error,
  allowedMimeTypes,
  maxFiles = 10,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  error?: string | null;
  allowedMimeTypes?: string[];
  maxFiles?: number;
  disabled?: boolean;
}) {
  /** Forwards picker files in browser display order. */ const choose =
    /** Implements the local choose operation. */ (
      event: ChangeEvent<HTMLInputElement>,
    ) => onFiles(Array.from(event.target.files ?? []));
  /** Accepts a dropped batch without navigating away from the application. */ const drop =
    /** Implements the local drop operation. */ (
      event: DragEvent<HTMLDivElement>,
    ) => {
      event.preventDefault();
      if (disabled) return;
      onFiles(Array.from(event.dataTransfer.files));
    };
  /** Keeps drag-over events eligible for dropping. */ const allowDrop =
    /** Implements the local allowDrop operation. */ (
      event: DragEvent<HTMLDivElement>,
    ) => event.preventDefault();
  return (
    <div className="upload-dropzone" onDragOver={allowDrop} onDrop={drop}>
      <span className="upload-mark" aria-hidden="true">
        ↑
      </span>
      <div>
        <strong>Add to your archive</strong>
        <p id="upload-guidance">
          Drop up to {maxFiles} files here, or choose from your device.
        </p>
      </div>
      <label className="ui-button secondary" htmlFor="file-picker">
        Select files<span className="sr-only"> or drop them here</span>
      </label>
      <input
        id="file-picker"
        type="file"
        multiple
        accept={allowedMimeTypes?.join(",")}
        disabled={disabled}
        aria-describedby="upload-guidance"
        onChange={choose}
      />
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

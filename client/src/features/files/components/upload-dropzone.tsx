"use client";
import type { ChangeEvent, DragEvent } from "react";
/** Provides keyboard-accessible picker and drag/drop file selection. */
export function UploadDropzone({
  onFiles,
  error,
}: {
  onFiles: (files: File[]) => void;
  error?: string | null;
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
      onFiles(Array.from(event.dataTransfer.files));
    };
  /** Keeps drag-over events eligible for dropping. */ const allowDrop =
    /** Implements the local allowDrop operation. */ (
      event: DragEvent<HTMLDivElement>,
    ) => event.preventDefault();
  return (
    <div onDragOver={allowDrop} onDrop={drop}>
      <label htmlFor="file-picker">Select files or drop them here</label>
      <input id="file-picker" type="file" multiple onChange={choose} />
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

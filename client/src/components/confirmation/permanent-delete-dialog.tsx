"use client";
import { useEffect, useRef } from "react";
/** Requires explicit accessible confirmation and restores focus after an irreversible action. */
export function PermanentDeleteDialog({
  open,
  subject,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  subject: string;
  pending?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      previousFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      cancelRef.current?.focus();
      return;
    }
    previousFocus.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
    >
      <h2 id="delete-title">Permanently delete {subject}?</h2>
      <p id="delete-description">This cannot be undone.</p>
      {error ? <p role="alert">{error}</p> : null}
      <button
        ref={cancelRef}
        type="button"
        onClick={onCancel}
        disabled={pending}
      >
        Cancel
      </button>
      <button type="button" onClick={onConfirm} disabled={pending}>
        {pending ? "Deleting…" : "Delete permanently"}
      </button>
    </div>
  );
}

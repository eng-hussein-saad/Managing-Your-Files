"use client";
import { useEffect, useRef, type KeyboardEvent } from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      previousFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      cancelRef.current?.focus();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    previousFocus.current?.focus();
  }, [open]);
  if (!open) return null;
  /** Contains keyboard focus and supports Escape cancellation while idle. */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && !pending) {
      onCancel();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]",
    );
    if (!controls?.length) return;
    const first = controls[0]!;
    const last = controls[controls.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return (
    <div className="dialog-backdrop"><div ref={dialogRef} className="app-dialog danger-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onKeyDown={handleKeyDown}
    >
      <h2 id="delete-title">Permanently delete {subject}?</h2>
      <p id="delete-description">This cannot be undone.</p>
      {error ? <p role="alert">{error}</p> : null}
      <div className="dialog-actions"><button
        ref={cancelRef}
        type="button"
        onClick={onCancel}
        disabled={pending}
      >
        Cancel
      </button>
      <button className="danger" type="button" onClick={onConfirm} disabled={pending}>
        {pending ? "Deleting…" : "Delete permanently"}
      </button>
      </div></div></div>
  );
}

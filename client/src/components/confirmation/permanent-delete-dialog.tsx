"use client";
import { Dialog } from "../overlays/overlay";
import { Button } from "../ui/controls";
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
  return (
    <Dialog
      open={open}
      title={`Permanently delete ${subject}?`}
      description="This cannot be undone."
      onClose={onCancel}
      dismissible={!pending}
    >
      {error ? <p role="alert">{error}</p> : null}
      <div className="dialog-actions">
        <Button
          variant="secondary"
          type="button"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          type="button"
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? "Deleting…" : "Delete permanently"}
        </Button>
      </div>
    </Dialog>
  );
}

"use client";
import { useState } from "react";
import { Dialog } from "../../../components/overlays/overlay";
import { Button, Field } from "../../../components/ui/controls";
/** Captures a validated display name for folder creation or rename. */
export function FolderNameDialog({
  mode,
  initialName = "",
  pending,
  error,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "rename";
  initialName?: string;
  pending?: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  /** Prevents empty display names from reaching the mutation. */ const submit =
    /** Implements the local submit operation. */ () => {
      const value = name.trim();
      if (value) onSubmit(value);
    };
  return (
    <Dialog
      open
      title={mode === "create" ? "Create folder" : "Rename folder"}
      description="Folder names are private to your archive and can contain up to 120 characters."
      onClose={onCancel}
    >
      <Field
        label="Folder name"
        autoFocus
        value={name}
        maxLength={120}
        onChange={
          /** Handles the bound UI event or state projection for this JSX control. */ (
            event,
          ) => setName(event.target.value)
        }
      />
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
          type="button"
          onClick={submit}
          busy={pending}
          disabled={!name.trim()}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </Dialog>
  );
}

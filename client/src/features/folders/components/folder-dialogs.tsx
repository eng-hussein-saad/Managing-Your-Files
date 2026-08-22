"use client";
import { useState } from "react";
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
    <div className="dialog-backdrop"><div className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="folder-dialog-title">
      <h2 id="folder-dialog-title">
        {mode === "create" ? "Create folder" : "Rename folder"}
      </h2>
      <label>
        Folder name{" "}
        <input
          autoFocus
          value={name}
          maxLength={120}
          onChange={
            /** Handles the bound UI event or state projection for this JSX control. */ (
              event,
            ) => setName(event.target.value)
          }
        />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <div className="dialog-actions"><button type="button" onClick={onCancel} disabled={pending}>
        Cancel
      </button>
      <button type="button" onClick={submit} disabled={pending || !name.trim()}>
        {pending ? "Saving…" : "Save"}
      </button>
      </div></div></div>
  );
}

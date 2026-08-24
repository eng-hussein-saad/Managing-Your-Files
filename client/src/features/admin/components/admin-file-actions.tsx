"use client";
import { useEffect, useRef, useState } from "react";
import type { AdminFile } from "@gold-era/contracts/public";
import { apiErrorCode, apiErrorMessage } from "../../../lib/api/api-error";
import { useToast } from "../../../components/toast/toast-provider";
import { useDeleteAdminFile } from "../hooks/use-admin-files";

/** Presents owner-aware permanent global file deletion confirmation. */
export function AdminFileActions({ file, onStale }: { file: AdminFile; onStale: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const cancel = useRef<HTMLButtonElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  const deletion = useDeleteAdminFile();
  const toast = useToast();
  useEffect(() => {
    if (open) {
      previous.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      cancel.current?.focus();
      return;
    }
    previous.current?.focus();
  }, [open]);
  /** Closes the dialog and clears the target confirmation. */
  const close = () => {
    setOpen(false);
    setConfirmation("");
    deletion.reset();
  };
  /** Permanently deletes the confirmed target with conflict recovery. */
  const confirm = async () => {
    try {
      await deletion.mutateAsync({
        id: file.id,
        input: {
          expectedUpdatedAt: file.updatedAt,
          confirmationOriginalName: confirmation,
        },
      });
      toast.notify("File permanently deleted.", { kind: "success" });
      close();
    } catch (error) {
      if (apiErrorCode(error) === "RESOURCE_CONFLICT") {
        close();
        onStale();
      }
    }
  };
  return (
    <>
      <button className="danger" type="button" onClick={() => setOpen(true)}>Delete permanently</button>
      {open ? <div className="dialog-backdrop" onKeyDown={(event) => event.key === "Escape" && !deletion.isPending && close()}>
        <section className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-file-delete-title">
          <h2 id="admin-file-delete-title">Permanently delete {file.originalName}?</h2>
          <p>Owner: {file.owner.name} ({file.owner.email}). This does not grant access to the file contents.</p>
          <label>Type {file.originalName} to confirm<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></label>
          {deletion.error ? <p role="alert">{apiErrorMessage(deletion.error)}</p> : null}
          <div className="dialog-actions"><button ref={cancel} onClick={close} disabled={deletion.isPending}>Cancel</button><button className="danger" disabled={deletion.isPending || confirmation !== file.originalName} onClick={() => void confirm()}>{deletion.isPending ? "Deleting…" : "Delete permanently"}</button></div>
        </section>
      </div> : null}
    </>
  );
}

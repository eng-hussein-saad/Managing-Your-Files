"use client";
import { useState } from "react";
import type { AdminFile } from "@gold-era/contracts/public";
import { apiErrorCode, apiErrorMessage } from "../../../lib/api/api-error";
import { useToast } from "../../../components/toast/toast-provider";
import { useDeleteAdminFile } from "../hooks/use-admin-files";
import { Dialog } from "../../../components/overlays/overlay";
import { Button, Field } from "../../../components/ui/controls";

/** Presents owner-aware permanent global file deletion confirmation. */
export function AdminFileActions({
  file,
  onStale,
}: {
  file: AdminFile;
  onStale: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const deletion = useDeleteAdminFile();
  const toast = useToast();
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
      <Button variant="danger" type="button" onClick={() => setOpen(true)}>
        Delete
      </Button>
      {open ? (
        <Dialog
          open
          title={`Permanently delete ${file.originalName}?`}
          description={`Owner: ${file.owner.name} (${file.owner.email}). This does not grant access to the file contents.`}
          onClose={close}
          dismissible={!deletion.isPending}
        >
          <Field
            label={`Type ${file.originalName} to confirm`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
          />
          {deletion.error ? (
            <p role="alert">{apiErrorMessage(deletion.error)}</p>
          ) : null}
          <div className="dialog-actions">
            <Button
              variant="secondary"
              onClick={close}
              disabled={deletion.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={
                deletion.isPending || confirmation !== file.originalName
              }
              onClick={() => void confirm()}
            >
              {deletion.isPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}

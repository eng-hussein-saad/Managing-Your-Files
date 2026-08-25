"use client";
import { useState } from "react";
import { useFolderContents, useFolderMutations } from "../hooks/use-folders";
import { Breadcrumbs } from "./breadcrumbs";
import { Dialog } from "../../../components/overlays/overlay";
import { Button } from "../../../components/ui/controls";
/** Selects virtual root or an owned folder and reports move outcomes safely. */
export function FileMoveDialog({
  fileId,
  onCancel,
  onMoved,
}: {
  fileId: string;
  onCancel: () => void;
  onMoved: () => void;
}) {
  const [location, setLocation] = useState<string | null>(null);
  const contents = useFolderContents(location);
  const mutation = useFolderMutations().moveFile;
  /** Moves to the currently displayed destination. */ const confirm =
    /** Implements the local confirm operation. */ () =>
      mutation.mutate(
        { id: fileId, folderId: location },
        { onSuccess: onMoved },
      );
  return (
    <Dialog
      open
      title="Move file"
      description="Choose an owned destination folder."
      onClose={onCancel}
    >
      <Breadcrumbs
        items={contents.data?.breadcrumbs ?? []}
        onNavigate={setLocation}
      />
      {contents.isLoading ? <p>Loading folders…</p> : null}
      <ul>
        {contents.data?.folders.map(
          /** Maps one source item into its derived public representation. */ (
            folder,
          ) => (
            <li key={folder.id}>
              <button
                type="button"
                onClick={
                  /** Handles the bound UI event or state projection for this JSX control. */ () =>
                    setLocation(folder.id)
                }
              >
                {folder.name}
              </button>
            </li>
          ),
        )}
      </ul>
      {mutation.isError ? (
        <p role="alert">The file could not be moved. Retry.</p>
      ) : null}
      <div className="dialog-actions">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={confirm} busy={mutation.isPending}>
          Move here
        </Button>
      </div>
    </Dialog>
  );
}

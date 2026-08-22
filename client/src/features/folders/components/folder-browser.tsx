"use client";
import { useState } from "react";
import { PermanentDeleteDialog } from "../../../components/confirmation/permanent-delete-dialog";
import { useDeleteFolder } from "../hooks/use-delete-folder";
import { useFolderContents, useFolderMutations } from "../hooks/use-folders";
import { Breadcrumbs } from "./breadcrumbs";
import { FolderNameDialog } from "./folder-dialogs";

/** Browses owned fixed-parent folders and composes accessible mutations. */
export function FolderBrowser({
  location,
  onNavigate,
}: {
  location: string | null;
  onNavigate: (id: string | null) => void;
}) {
  const contents = useFolderContents(location);
  const mutations = useFolderMutations();
  const deletion = useDeleteFolder();
  const [dialog, setDialog] = useState<"create" | "rename" | "delete" | null>(
    null,
  );
  const current = contents.data?.folder;
  /** Submits create or rename against the current fixed location. */ const save =
    /** Implements the local save operation. */ (name: string) => {
      if (dialog === "create")
        mutations.create.mutate(
          { name, parentId: location },
          {
            onSuccess:
              /** Implements the onSuccess callback for this configured operation. */ () =>
                setDialog(null),
          },
        );
      else if (dialog === "rename" && current)
        mutations.rename.mutate(
          { id: current.id, name },
          {
            onSuccess:
              /** Implements the onSuccess callback for this configured operation. */ () =>
                setDialog(null),
          },
        );
    };
  /** Deletes the current empty folder and returns to its parent after success. */ const remove =
    /** Implements the local remove operation. */ () => {
      if (current)
        deletion.mutate(current.id, {
          onSuccess:
            /** Implements the onSuccess callback for this configured operation. */ () => {
              setDialog(null);
              onNavigate(current.parentId);
            },
        });
    };
  return (
    <section aria-label="Folders">
      <Breadcrumbs
        items={contents.data?.breadcrumbs ?? []}
        onNavigate={onNavigate}
      />
      <button
        type="button"
        onClick={
          /** Handles the bound UI event or state projection for this JSX control. */ () =>
            setDialog("create")
        }
        disabled={(current?.depth ?? 0) >= 10}
      >
        New folder
      </button>
      {current ? (
        <>
          <button
            type="button"
            onClick={
              /** Handles the bound UI event or state projection for this JSX control. */ () =>
                setDialog("rename")
            }
          >
            Rename folder
          </button>
          <button
            type="button"
            onClick={
              /** Handles the bound UI event or state projection for this JSX control. */ () =>
                setDialog("delete")
            }
          >
            Delete folder
          </button>
        </>
      ) : null}
      {contents.isLoading ? <p>Loading folders…</p> : null}
      {contents.isError ? (
        <p role="alert">Folders could not be loaded.</p>
      ) : null}
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
                    onNavigate(folder.id)
                }
              >
                {folder.name}
              </button>
            </li>
          ),
        )}
      </ul>
      {dialog === "create" || dialog === "rename" ? (
        <FolderNameDialog
          mode={dialog}
          initialName={dialog === "rename" ? current?.name : ""}
          pending={mutations.create.isPending || mutations.rename.isPending}
          error={
            mutations.create.isError || mutations.rename.isError
              ? "The folder could not be saved."
              : undefined
          }
          onCancel={
            /** Handles the bound UI event or state projection for this JSX control. */ () =>
              setDialog(null)
          }
          onSubmit={save}
        />
      ) : null}
      <PermanentDeleteDialog
        open={dialog === "delete"}
        subject={current?.name ?? "folder"}
        pending={deletion.isPending}
        error={
          deletion.isError
            ? "The folder must be empty, or deletion can be retried."
            : undefined
        }
        onCancel={
          /** Handles the bound UI event or state projection for this JSX control. */ () =>
            setDialog(null)
        }
        onConfirm={remove}
      />
    </section>
  );
}

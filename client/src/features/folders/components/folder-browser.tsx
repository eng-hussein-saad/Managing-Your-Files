"use client";
import { useEffect, useState } from "react";
import { PermanentDeleteDialog } from "../../../components/confirmation/permanent-delete-dialog";
import { useDeleteFolder } from "../hooks/use-delete-folder";
import { useFolderContents, useFolderMutations } from "../hooks/use-folders";
import { Breadcrumbs } from "./breadcrumbs";
import { FolderNameDialog } from "./folder-dialogs";
import { FolderIcon } from "../../../components/ui/icons";

/** Browses owned fixed-parent folders and composes accessible mutations. */
export function FolderBrowser({
  location,
  onNavigate,
  createRequest = 0,
}: {
  location: string | null;
  onNavigate: (id: string | null) => void;
  createRequest?: number;
}) {
  const contents = useFolderContents(location);
  const mutations = useFolderMutations();
  const deletion = useDeleteFolder();
  const [dialog, setDialog] = useState<"create" | "rename" | "delete" | null>(
    null,
  );
  useEffect(
    /** Opens folder creation when the page-level reference action is activated. */ () => {
      if (createRequest > 0) setDialog("create");
    },
    [createRequest],
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
    <section className="folder-browser" aria-label="Folders">
      <Breadcrumbs
        items={contents.data?.breadcrumbs ?? []}
        onNavigate={onNavigate}
      />
      {contents.isLoading ? (
        <p className="muted-state">Loading folders…</p>
      ) : null}
      {contents.isError ? (
        <p role="alert">Folders could not be loaded.</p>
      ) : null}
      <ul className="folder-list">
        <li>
          <button
            className={`folder-entry ${location === null ? "active" : ""}`}
            type="button"
            onClick={
              /** Returns the folder browser to the owner-scoped root. */ () =>
                onNavigate(null)
            }
          >
            <FolderIcon />
            <span>My Files</span>
          </button>
        </li>
        {contents.data?.folders.map(
          /** Maps one source item into its derived public representation. */ (
            folder,
          ) => (
            <li key={folder.id}>
              <button
                className="folder-entry"
                type="button"
                title={folder.name}
                onClick={
                  /** Handles the bound UI event or state projection for this JSX control. */ () =>
                    onNavigate(folder.id)
                }
              >
                <FolderIcon />
                <span>{folder.name}</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          ),
        )}
      </ul>
      <div className="folder-actions">
        <button
          className="ui-button secondary"
          type="button"
          onClick={
            /** Opens folder creation below the folder collection. */ () =>
              setDialog("create")
          }
          disabled={(current?.depth ?? 0) >= 10}
        >
          <span aria-hidden="true">＋</span> New folder
        </button>
        {current ? (
          <>
            <button
              className="ui-button ghost"
              type="button"
              onClick={
                /** Opens rename for the active owned folder. */ () =>
                  setDialog("rename")
              }
            >
              Rename
            </button>
            <button
              className="ui-button danger"
              type="button"
              onClick={
                /** Opens guarded deletion for the active owned folder. */ () =>
                  setDialog("delete")
              }
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
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

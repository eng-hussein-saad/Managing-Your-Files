"use client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { FileQuery } from "../../../features/files/api/files.api";
import { FileCollection } from "../../../features/files/components/file-collection";
import { FileDetails } from "../../../features/files/components/file-details";
import { FilePagination } from "../../../features/files/components/file-pagination";
import { FileQueryToolbar } from "../../../features/files/components/file-query-toolbar";
import { UploadDropzone } from "../../../features/files/components/upload-dropzone";
import { UploadQueue } from "../../../features/files/components/upload-queue";
import { useFile, useFiles } from "../../../features/files/hooks/use-files";
import { useUploadQueue } from "../../../features/files/upload/use-upload-queue";
import { useUploadPolicy } from "../../../features/files/hooks/use-upload-policy";
import { FileMoveDialog } from "../../../features/folders/components/file-move-dialog";
import { FolderBrowser } from "../../../features/folders/components/folder-browser";
import { CloseIcon, UploadIcon } from "../../../components/ui/icons";
import { Skeleton } from "../../../components/ui/surfaces";

/** Composes upload, folder navigation, discovery, details, movement, and deletion. */
export default function FilesPage() {
  const queryClient = useQueryClient();
  const uploadPolicy = useUploadPolicy();
  const queue = useUploadQueue(uploadPolicy.data);
  const [location, setLocation] = useState<string | null>(null);
  const [query, setQuery] = useState<FileQuery>({
    sort: "uploadedAt",
    direction: "desc",
    page: 1,
    pageSize: 20,
    folderId: "root",
  });
  const [view, setView] = useState<"list" | "grid">("list");
  const [selected, setSelected] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const effectiveQuery = {
    ...query,
    folderId: location ?? "root",
  } satisfies FileQuery;
  const files = useFiles(effectiveQuery);
  const detail = useFile(selected);
  const meta = files.data?.meta ?? {
    page: query.page ?? 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  };
  /** Clamps the active page when lifecycle changes shrink the collection. */ useEffect(() => {
    if (meta.totalPages > 0 && (query.page ?? 1) > meta.totalPages)
      setQuery((current) => ({ ...current, page: meta.totalPages }));
  }, [meta.totalPages, query.page]);
  /** Navigates folders while clearing stale detail and page state. */ const navigate =
    (id: string | null) => {
      setLocation(id);
      setSelected(null);
      setQuery((current) => ({ ...current, page: 1 }));
    };
  /** Applies one toolbar change without discarding unrelated filters. */ const changeQuery =
    (change: Partial<FileQuery>) =>
      setQuery((current) => ({ ...current, ...change }));
  /** Runs the deterministic upload queue and then refreshes the active collection. */ const upload =
    async () => {
      await queue.run(location);
      await Promise.all([
        files.refetch(),
        uploadPolicy.refetch(),
        queryClient.invalidateQueries({ queryKey: ["file-statistics"] }),
      ]);
    };
  /** Closes the uploader and removes completed rows while retaining retryable work. */
  const closeUpload = () => {
    if (queue.items.some((item) => item.status === "uploading")) return;
    queue.clearSettled();
    setUploadOpen(false);
  };
  const hasFilters = Boolean(query.search || query.type);
  const isUploading = queue.items.some((item) => item.status === "uploading");
  return (
    <main id="main" className="files-page app-page">
      <header className="page-heading files-heading">
        <div>
          <span className="eyebrow">My workspace</span>
          <h1>My Files</h1>
          <p>Browse, upload, and organize everything you own.</p>
        </div>
        <div className="head-actions">
          <button
            className="ui-button primary"
            type="button"
            onClick={
              /** Opens the approved upload dialog without displacing the workspace. */ () =>
                setUploadOpen(true)
            }
          >
            <UploadIcon />
            Upload files
          </button>
        </div>
      </header>
      <div className="files-workspace">
        <aside className="folders-panel">
          <div className="panel-title">
            <span>Folders</span>
          </div>
          <FolderBrowser location={location} onNavigate={navigate} />
        </aside>
        <section
          className="collection-panel ui-local-scroll"
          aria-label="Files"
          tabIndex={0}
        >
          <div className="collection-heading">
            <div>
              <h2>{location ? "Folder files" : "All files"}</h2>
              <span>
                {meta.totalItems} {meta.totalItems === 1 ? "item" : "items"}
              </span>
            </div>
          </div>
          <FileQueryToolbar
            query={query}
            view={view}
            onChange={changeQuery}
            onView={setView}
          />
          {files.isLoading ? (
            <div className="collection-loading" aria-busy="true">
              <span />
              <span />
              <span />
            </div>
          ) : null}
          {files.isError ? (
            <div className="inline-state error-state" role="alert">
              <span>
                Files could not be loaded.{" "}
                <button
                  type="button"
                  onClick={() => {
                    void files.refetch();
                  }}
                >
                  Retry
                </button>
              </span>
            </div>
          ) : null}
          {files.data ? (
            <FileCollection
              files={files.data.data}
              view={view}
              hasFilters={hasFilters}
              onSelect={setSelected}
            />
          ) : null}
          <FilePagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPage={(page) => changeQuery({ page })}
          />
        </section>
      </div>
      {uploadOpen ? (
        <div
          className="ui-overlay-backdrop"
          onMouseDown={
            /** Closes the upload dialog only from its safe backdrop. */ (
              event,
            ) => {
              if (event.target === event.currentTarget) closeUpload();
            }
          }
        >
          <section
            className="ui-overlay-panel dialog upload-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-dialog-title"
          >
            <button
              className="ui-icon-button upload-dialog-close"
              type="button"
              aria-label="Close upload"
              disabled={isUploading}
              onClick={
                /** Closes the explicit upload dialog action. */ () =>
                  closeUpload()
              }
            >
              <CloseIcon />
            </button>
            <h2 id="upload-dialog-title">Upload to My Files</h2>
            <p>
              Select 1–10 files. Uploads run sequentially and earlier successes
              remain if a later file fails.
            </p>
            <UploadDropzone
              onFiles={queue.add}
              error={
                queue.selectionError ??
                (uploadPolicy.isError
                  ? "Upload rules could not be loaded. Retry by reopening this dialog."
                  : null)
              }
              allowedMimeTypes={uploadPolicy.data?.allowedMimeTypes}
              maxFiles={uploadPolicy.data?.maxFilesPerBatch}
              disabled={!uploadPolicy.data}
            />
            {queue.items.length > 0 ? (
              <section
                className="upload-panel"
                aria-label="Files ready to upload"
              >
                <UploadQueue
                  items={queue.items}
                  onRetry={
                    /** Retries one failed upload without resetting successful queue items. */ (
                      id,
                    ) => {
                      void queue.retry(id, location);
                    }
                  }
                />
                <button
                  className="ui-button primary"
                  type="button"
                  disabled={isUploading}
                  aria-busy={isUploading}
                  onClick={
                    /** Runs the approved upload queue and retains visible settled results. */ () => {
                      void upload();
                    }
                  }
                >
                  {isUploading ? (
                    <span className="upload-action-spinner" aria-hidden="true" />
                  ) : (
                    <UploadIcon />
                  )}
                  {isUploading ? "Uploading files…" : "Upload queued files"}
                </button>
              </section>
            ) : null}
          </section>
        </div>
      ) : null}
      {detail.isLoading ? (
        <div className="detail-loading">
          <Skeleton label="Loading file details" lines={5} />
        </div>
      ) : null}
      {detail.isError ? (
        <p role="alert">File details are unavailable.</p>
      ) : null}
      {detail.data ? (
        <div
          className="detail-overlay ui-overlay-backdrop drawer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div
            className="detail-drawer ui-overlay-panel drawer"
            role="dialog"
            aria-modal="true"
            aria-label="File details"
          >
            <button
              className="drawer-close ui-icon-button"
              type="button"
              aria-label="Close file details"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            <FileDetails
              file={detail.data}
              onMove={() => setMoving(true)}
              onDeleted={() => {
                setSelected(null);
                void files.refetch();
              }}
            />
          </div>
        </div>
      ) : null}
      {moving && selected ? (
        <FileMoveDialog
          fileId={selected}
          onCancel={() => setMoving(false)}
          onMoved={() => {
            setMoving(false);
            setSelected(null);
            void files.refetch();
          }}
        />
      ) : null}
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import type { FileQuery } from "../../../features/files/api/files.api";
import { FileCollection } from "../../../features/files/components/file-collection";
import { FileDetails } from "../../../features/files/components/file-details";
import { FilePagination } from "../../../features/files/components/file-pagination";
import { FileQueryToolbar } from "../../../features/files/components/file-query-toolbar";
import { UploadDropzone } from "../../../features/files/components/upload-dropzone";
import { UploadQueue } from "../../../features/files/components/upload-queue";
import { useFile, useFiles } from "../../../features/files/hooks/use-files";
import { useUploadQueue } from "../../../features/files/upload/use-upload-queue";
import { FileMoveDialog } from "../../../features/folders/components/file-move-dialog";
import { FolderBrowser } from "../../../features/folders/components/folder-browser";

/** Composes upload, folder navigation, discovery, details, movement, and deletion. */
export default function FilesPage() {
  const queue = useUploadQueue();
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
      await files.refetch();
    };
  const hasFilters = Boolean(query.search || query.type);
  return (
    <main id="main">
      <h1>My Files</h1>
      <p>
        Upload, inspect, organize, and permanently remove your private files.
      </p>
      <FolderBrowser location={location} onNavigate={navigate} />
      <UploadDropzone onFiles={queue.add} error={queue.selectionError} />
      {queue.items.length > 0 ? (
        <>
          <UploadQueue
            items={queue.items}
            onRetry={(id) => {
              void queue.retry(id, location);
            }}
          />
          <button
            type="button"
            onClick={() => {
              void upload();
            }}
          >
            Upload queued files
          </button>
        </>
      ) : null}
      <FileQueryToolbar
        query={query}
        view={view}
        onChange={changeQuery}
        onView={setView}
      />
      {files.isLoading ? <p>Loading files…</p> : null}
      {files.isError ? (
        <p role="alert">
          Files could not be loaded.{" "}
          <button
            type="button"
            onClick={() => {
              void files.refetch();
            }}
          >
            Retry
          </button>
        </p>
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
      {detail.isLoading ? <p>Loading file details…</p> : null}
      {detail.isError ? (
        <p role="alert">File details are unavailable.</p>
      ) : null}
      {detail.data ? (
        <FileDetails
          file={detail.data}
          onMove={() => setMoving(true)}
          onDeleted={() => {
            setSelected(null);
            void files.refetch();
          }}
        />
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

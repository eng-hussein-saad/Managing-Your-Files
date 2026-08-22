"use client";
import { useState } from "react";
import axios from "axios";
import { uploadFile } from "../api/file-upload.api";
import type { QueueItem } from "./upload.types";

interface UploadErrorBody {
  error?: { message?: string };
  meta?: { usedBytes: string; remainingBytes: string; limitBytes: string };
}

/** Maintains an ordered one-at-a-time upload queue so earlier successes persist. */
export function useUploadQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  /** Adds one valid-sized displayed batch without silently dropping the eleventh item. */
  const add = /** Implements the local add operation. */ (files: File[]) => {
    if (files.length > 10) {
      setSelectionError("Select no more than 10 files at a time.");
      return;
    }
    setSelectionError(null);
    setItems(
      /** Executes the callback required by the surrounding operation. */ (
        current,
      ) => [
        ...current,
        ...files.map(
          /** Maps one source item into its derived public representation. */ (
            file,
          ) => ({
            id: crypto.randomUUID(),
            file,
            status: "pending" as const,
            progress: 0,
          }),
        ),
      ],
    );
  };
  /** Replaces one queue entry while preserving the displayed order. */
  const update = /** Implements the local update operation. */ (
    id: string,
    change: Partial<QueueItem>,
  ) =>
    setItems(
      /** Executes the callback required by the surrounding operation. */ (
        current,
      ) =>
        current.map(
          /** Maps one source item into its derived public representation. */ (
            entry,
          ) => (entry.id === id ? { ...entry, ...change } : entry),
        ),
    );
  /** Uploads one entry and captures safe server feedback for independent retry. */
  const uploadOne = /** Implements the local uploadOne operation. */ async (
    item: QueueItem,
    folderId: string | null,
  ) => {
    update(item.id, {
      status: "uploading",
      progress: 0,
      error: undefined,
      quota: undefined,
    });
    try {
      /** Associates progress only with the active ordered item. */ const report =
        /** Implements the local report operation. */ (progress: number) =>
          update(item.id, { progress });
      const result = await uploadFile(item.file, folderId, report);
      update(item.id, { status: "success", progress: 100, result });
    } catch (error) {
      const body = axios.isAxiosError<UploadErrorBody>(error)
        ? error.response?.data
        : undefined;
      update(item.id, {
        status: "error",
        error: body?.error?.message ?? "Upload failed. Retry this file.",
        quota: body?.meta,
      });
    }
  };
  /** Runs pending and failed entries sequentially in displayed order. */
  const run = /** Implements the local run operation. */ async (
    folderId: string | null = null,
  ) => {
    for (const item of items.filter(
      /** Keeps only items that satisfy this operation's predicate. */ (
        entry,
      ) => entry.status === "pending" || entry.status === "error",
    ))
      await uploadOne(item, folderId);
  };
  /** Retries exactly one failed item without changing earlier outcomes. */
  const retry = /** Implements the local retry operation. */ async (
    id: string,
    folderId: string | null = null,
  ) => {
    const item = items.find(
      /** Executes the callback required by the surrounding operation. */ (
        entry,
      ) => entry.id === id,
    );
    if (item) await uploadOne(item, folderId);
  };
  return { items, selectionError, add, run, retry };
}

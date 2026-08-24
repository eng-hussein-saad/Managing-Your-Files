"use client";
import { useRouter, useSearchParams } from "next/navigation";
import type { AdminFileFilters } from "../../../features/admin/api/admin-files.api";
import { AdminFileDirectory } from "../../../features/admin/components/admin-file-directory";

type CompleteFileQuery = AdminFileFilters & { page: number; pageSize: 5 | 10 | 20; sort: "name" | "owner" | "size" | "uploadedAt"; direction: "asc" | "desc"; folder: "any" | "root" | "foldered" };

/** Parses bounded global file filters from the current URL. */
function fileQuery(params: URLSearchParams): CompleteFileQuery {
  const pageSize = Number(params.get("pageSize"));
  const type = params.get("type");
  const sort = params.get("sort");
  const folder = params.get("folder");
  return {
    search: params.get("search") || undefined,
    type: type === "pdf" || type === "text" || type === "image" || type === "document" ? type : undefined,
    folder: folder === "root" || folder === "foldered" ? folder : "any",
    sort: sort === "name" || sort === "owner" || sort === "size" ? sort : "uploadedAt",
    direction: params.get("direction") === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(params.get("page")) || 1),
    pageSize: pageSize === 5 || pageSize === 10 ? pageSize : 20,
  };
}

/** Provides URL-backed metadata-only global file administration. */
export default function AdminFilesPage() {
  const params = useSearchParams();
  const router = useRouter();
  const query = fileQuery(new URLSearchParams(params.toString()));
  /** Replaces normalized URL state after one filter or pagination change. */
  const update = (next: Partial<AdminFileFilters>) => {
    const values = { ...query, ...next };
    const updated = new URLSearchParams();
    for (const [key, value] of Object.entries(values))
      if (value !== undefined && value !== "" && value !== "any") updated.set(key, String(value));
    router.replace(`/admin/files?${updated.toString()}`);
  };
  return <main id="main" className="app-page"><header className="page-heading"><div><span className="eyebrow">Administration</span><h1>Global files</h1><p>Inspect safe metadata across owners. Administrator authority does not grant content access.</p></div></header><AdminFileDirectory query={query} update={update} /></main>;
}

"use client";
import type { AdminAuditQuery } from "@gold-era/contracts/public";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminAuditHistory } from "../../../features/admin/components/admin-audit-history";
import { AdminPageHeader } from "../../../features/admin/components/admin-page-header";

/** Parses bounded sanitized audit filters from the current URL. */
function auditQuery(params: URLSearchParams): AdminAuditQuery {
  const pageSize = Number(params.get("pageSize"));
  const actorState = params.get("actorState");
  return {
    search: params.get("search") || undefined,
    action: undefined,
    entityType: undefined,
    actorId: undefined,
    actorState:
      actorState === "user" ||
      actorState === "deleted"
        ? actorState
        : undefined,
    outcome: undefined,
    createdFrom: undefined,
    createdBefore: undefined,
    direction: params.get("direction") === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(params.get("page")) || 1),
    pageSize: pageSize === 5 || pageSize === 10 ? pageSize : 20,
  };
}

/** Provides URL-backed retained sanitized audit history. */
export default function AdminAuditPage() {
  const params = useSearchParams();
  const router = useRouter();
  const query = auditQuery(new URLSearchParams(params.toString()));
  /** Replaces normalized URL state after one filter or pagination change. */
  const update = (next: Partial<AdminAuditQuery>) => {
    const values = { ...query, ...next };
    const updated = new URLSearchParams();
    for (const [key, value] of Object.entries(values))
      if (value !== undefined && value !== "") updated.set(key, String(value));
    router.replace(`/admin/audit?${updated.toString()}`);
  };
  return (
    <main id="main" className="app-page">
      <AdminPageHeader
        title="Audit history"
        description="Successful file, folder, and administrator-controlled changes, newest first."
      />
      <AdminAuditHistory query={query} update={update} />
    </main>
  );
}

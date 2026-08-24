import type {
  AdminAuditEvent,
  AdminAuditQuery,
  AdminPageMeta,
  AdminStatistics,
} from "@gold-era/contracts/public";
import { expressClient } from "../../../lib/api/express-client";

/** Requests exact current platform statistics. */
export async function getAdminStatistics(signal?: AbortSignal) {
  const response = await expressClient.get<{ success: true; data: AdminStatistics }>(
    "/api/v1/admin/statistics",
    { signal },
  );
  return response.data.data;
}

/** Requests one sanitized retained administrator audit page. */
export async function getAdminAuditEvents(query: AdminAuditQuery, signal?: AbortSignal) {
  const response = await expressClient.get<{
    success: true;
    data: AdminAuditEvent[];
    meta: AdminPageMeta;
  }>("/api/v1/admin/audit-events", { params: query, signal });
  return response.data;
}

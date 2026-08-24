import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AdminAuditQuery } from "@gold-era/contracts/public";
import { getAdminAuditEvents, getAdminStatistics } from "../api/admin-monitoring.api";
import { adminKeys } from "../query-keys";

/** Loads exact current platform statistics with request cancellation. */
export function useAdminStatistics() {
  return useQuery({
    queryKey: adminKeys.statistics(),
    queryFn: /** Requests a fresh exact statistics snapshot. */ ({ signal }) =>
      getAdminStatistics(signal),
  });
}

/** Loads one cancellable sanitized audit page while retaining the previous page. */
export function useAdminAuditEvents(query: AdminAuditQuery) {
  return useQuery({
    queryKey: adminKeys.auditList(query),
    queryFn: /** Requests the current normalized audit page. */ ({ signal }) =>
      getAdminAuditEvents(query, signal),
    placeholderData: keepPreviousData,
  });
}

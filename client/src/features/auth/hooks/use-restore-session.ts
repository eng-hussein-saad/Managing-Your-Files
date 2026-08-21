"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AccessSession } from "@gold-era/contracts/public";
import { gatewayClient } from "../../../lib/api/gateway-client";
import { authQueryKeys } from "../query-keys";
import { clearSession, setSession } from "../auth-store";
/** Restores memory-only access state once from the unreadable refresh cookie. */
export function useRestoreSession(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    const controller = new AbortController();
    void gatewayClient
      .post<{ success: true; data: AccessSession }>("/refresh", undefined, {
        signal: controller.signal,
      })
      .then((response) => setSession(response.data.data))
      .catch(() => {
        clearSession();
        void queryClient.removeQueries({ queryKey: authQueryKeys.all });
      });
    return () => controller.abort();
  }, [queryClient]);
}

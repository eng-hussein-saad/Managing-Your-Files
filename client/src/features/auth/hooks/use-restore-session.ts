"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { renewSession } from "../../../lib/api/session-renewal";
import { authQueryKeys } from "../query-keys";
import { clearSession } from "../auth-store";
/** Restores memory-only access state once from the unreadable refresh cookie. */
export function useRestoreSession(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    void renewSession().catch(() => {
      if (active) {
        clearSession();
        void queryClient.removeQueries({ queryKey: authQueryKeys.all });
      }
    });
    return () => {
      active = false;
    };
  }, [queryClient]);
}

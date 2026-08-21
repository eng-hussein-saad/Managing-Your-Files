"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gatewayClient } from "../../../lib/api/gateway-client";
import { authQueryKeys } from "../query-keys";
import { clearSession } from "../auth-store";
/** Clears local session/cache state whether or not remote revocation is available. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await gatewayClient.post("/logout");
      } finally {
        clearSession();
        queryClient.removeQueries({ queryKey: authQueryKeys.all });
      }
    },
  });
}

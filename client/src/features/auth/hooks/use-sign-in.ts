"use client";
import { useMutation } from "@tanstack/react-query";
import type { AccessSession, LoginRequest } from "@gold-era/contracts/public";
import { gatewayClient } from "../../../lib/api/gateway-client";
import { setSession } from "../auth-store";
/** Signs in through the narrow gateway and stores access state only in memory. */
export function useSignIn() {
  return useMutation({
    mutationFn: async (input: LoginRequest) => {
      const response = await gatewayClient.post<{
        success: true;
        data: AccessSession;
      }>("/login", input);
      setSession(response.data.data);
      return response.data.data;
    },
  });
}

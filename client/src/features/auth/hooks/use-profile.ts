"use client";
import { useQuery } from "@tanstack/react-query";
import type { SafeUser } from "@gold-era/contracts/public";
import { expressClient } from "../../../lib/api/express-client";
import { authQueryKeys } from "../query-keys";
/** Fetches only the authenticated user's safe profile directly from Express. */
export function useProfile() {
  return useQuery({
    queryKey: authQueryKeys.profile,
    queryFn: async () => {
      const response = await expressClient.get<{
        success: true;
        data: SafeUser;
      }>("/api/v1/users/me");
      return response.data.data;
    },
  });
}

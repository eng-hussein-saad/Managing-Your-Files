import type { AccessSession } from "@gold-era/contracts/public";
import { setSession } from "../../features/auth/auth-store";
import { gatewayClient } from "./gateway-client";

let refreshPromise: Promise<AccessSession> | null = null;

/** Shares one refresh-token rotation across every browser renewal trigger. */
export function renewSession(): Promise<AccessSession> {
  if (!refreshPromise)
    refreshPromise = gatewayClient
      .post<{ success: true; data: AccessSession }>("/refresh")
      .then((response) => {
        setSession(response.data.data);
        return response.data.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  return refreshPromise;
}

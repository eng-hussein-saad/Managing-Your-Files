import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import type { AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  accessToken,
  clearSession,
  setAuthState,
} from "../../src/features/auth/auth-store";
import { useRestoreSession } from "../../src/features/auth/hooks/use-restore-session";
import { gatewayClient } from "../../src/lib/api/gateway-client";

function RestorationHarness() {
  useRestoreSession();
  return null;
}

afterEach(() => {
  clearSession();
  vi.restoreAllMocks();
});

describe("reload restoration state", () => {
  it("starts without browser-readable access and clears on failure", () => {
    setAuthState({ status: "loading", session: null });
    expect(accessToken()).toBeNull();
    clearSession();
    expect(accessToken()).toBeNull();
  });

  it("shares one refresh rotation across Strict Mode effect replay", async () => {
    const refresh = vi.spyOn(gatewayClient, "post").mockResolvedValue({
      data: {
        success: true,
        data: {
          accessToken: "replacement",
          tokenType: "Bearer",
          expiresIn: 900,
          user: {
            id: "d2e2ad88-7d91-4209-94cf-0d0c7fcbfa32",
            name: "Ada",
            email: "ada@example.com",
            role: "USER",
            isEmailVerified: true,
            createdAt: "2026-08-20T00:00:00.000Z",
            updatedAt: "2026-08-20T00:00:00.000Z",
          },
        },
      },
    } as AxiosResponse);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RestorationHarness />
        </QueryClientProvider>
      </StrictMode>,
    );

    await waitFor(() => expect(accessToken()).toBe("replacement"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

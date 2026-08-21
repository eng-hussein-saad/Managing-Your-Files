import axios, { AxiosError, type AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { gatewayClient } from "../../src/lib/api/gateway-client";
import { installRenewalInterceptor } from "../../src/lib/api/renewal-interceptor";

const user = {
  id: "d2e2ad88-7d91-4209-94cf-0d0c7fcbfa32",
  name: "Ada",
  email: "ada@example.com",
  role: "USER",
  isEmailVerified: true,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
} as const;
afterEach(() => vi.restoreAllMocks());

describe("single-flight renewal", () => {
  it("shares one rotation across 20 failures and retries each request once", async () => {
    let renewals = 0;
    let authenticatedCalls = 0;
    vi.spyOn(gatewayClient, "post").mockImplementation(async () => {
      renewals += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return {
        data: {
          success: true,
          data: {
            accessToken: "replacement",
            tokenType: "Bearer",
            expiresIn: 900,
            user,
          },
        },
      } as AxiosResponse;
    });
    const client = axios.create({
      adapter: async (config) => {
        if (config.headers.Authorization === "Bearer replacement") {
          authenticatedCalls += 1;
          return {
            data: { ok: true },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          };
        }
        throw new AxiosError("expired", "ERR_BAD_REQUEST", config, undefined, {
          data: {
            success: false,
            error: { code: "AUTH_ACCESS_EXPIRED", message: "Expired" },
          },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        });
      },
    });
    installRenewalInterceptor(client);
    const results = await Promise.all(
      Array.from({ length: 20 }, (_value, index) =>
        client.get(`/protected/${index}`),
      ),
    );
    expect(renewals).toBe(1);
    expect(authenticatedCalls).toBe(20);
    expect(results.every((result) => result.status === 200)).toBe(true);
  });
  it("does not renew non-authentication failures", async () => {
    const refresh = vi.spyOn(gatewayClient, "post");
    const client = axios.create({
      adapter: async (config) => {
        throw new AxiosError("failure", "ERR_BAD_REQUEST", config, undefined, {
          data: {
            success: false,
            error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" },
          },
          status: 503,
          statusText: "Unavailable",
          headers: {},
          config,
        });
      },
    });
    installRenewalInterceptor(client);
    await expect(client.get("/protected")).rejects.toThrow();
    expect(refresh).not.toHaveBeenCalled();
  });
});

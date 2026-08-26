import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import type { ErrorEnvelope } from "@gold-era/contracts/public";
import { clearSession } from "../../features/auth/auth-store";
import { renewSession } from "./session-renewal";

interface RetriableConfig extends InternalAxiosRequestConfig {
  _authRetried?: boolean;
}
/** Installs single-flight renewal with at most one replay per protected request. */
export function installRenewalInterceptor(
  client: AxiosInstance,
  onFailure: () => void = clearSession,
): number {
  return client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ErrorEnvelope>) => {
      const config = error.config as RetriableConfig | undefined;
      const code =
        error.response?.data.success === false
          ? error.response.data.error.code
          : undefined;
      if (
        !config ||
        config._authRetried ||
        error.response?.status !== 401 ||
        (code !== "AUTH_ACCESS_EXPIRED" && code !== "AUTH_ACCESS_INVALID")
      )
        throw error;
      config._authRetried = true;
      try {
        const session = await renewSession();
        config.headers.Authorization = `Bearer ${session.accessToken}`;
        return await client(config);
      } catch (renewalError) {
        onFailure();
        throw renewalError;
      }
    },
  );
}

import type { RequestHandler } from "express";
import type { LoginRequest } from "@gold-era/contracts/public";
import type { LoginService } from "../../modules/auth/login.service.js";
import type { RefreshService } from "../../modules/auth/refresh.service.js";
import type { LogoutService } from "../../modules/auth/logout.service.js";
import { success } from "../respond.js";

/** Creates trusted server-to-server credential lifecycle handlers. */
export function trustedAuthController(
  login: LoginService,
  refresh: RefreshService,
  logout: LogoutService,
): { login: RequestHandler; refresh: RequestHandler; logout: RequestHandler } {
  return {
    login: async (request, response, next) => {
      try {
        const body = request.body as LoginRequest;
        success(response, 200, await login.login(body.email, body.password));
      } catch (error) {
        next(error);
      }
    },
    refresh: async (request, response, next) => {
      try {
        const body = request.body as { refreshToken: string };
        success(response, 200, await refresh.refresh(body.refreshToken));
      } catch (error) {
        next(error);
      }
    },
    logout: async (request, response, next) => {
      try {
        const body = request.body as { refreshToken?: string };
        success(response, 200, await logout.logout(body.refreshToken));
      } catch (error) {
        next(error);
      }
    },
  };
}

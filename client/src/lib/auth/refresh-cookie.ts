import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { ClientServerEnv } from "../config/server-env";

/** Converts the shared compact refresh lifetime into whole seconds. */
function seconds(value: string): number {
  const amount = Number.parseInt(value.slice(0, -1), 10);
  return (
    amount * ({ s: 1, m: 60, h: 3600, d: 86400 }[value.at(-1) ?? "s"] ?? 1)
  );
}
/** Centralizes the host-only HttpOnly cookie policy for issued credentials. */
export function refreshCookie(
  env: ClientServerEnv,
  value: string,
): ResponseCookie {
  return {
    name: env.REFRESH_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: env.REFRESH_COOKIE_SECURE,
    sameSite: env.REFRESH_COOKIE_SAME_SITE,
    path: env.REFRESH_COOKIE_PATH,
    maxAge: seconds(env.REFRESH_TOKEN_TTL),
  };
}
/** Produces the matching immediate-expiry cookie used by renewal and logout failures. */
export function clearedRefreshCookie(env: ClientServerEnv): ResponseCookie {
  return { ...refreshCookie(env, ""), expires: new Date(0), maxAge: 0 };
}

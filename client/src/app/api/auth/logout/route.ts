import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverEnv } from "../../../../lib/config/server-env";
import { isSameOrigin } from "../../../../lib/auth/same-origin";
import { clearedRefreshCookie } from "../../../../lib/auth/refresh-cookie";

/** Requests presented-token revocation and always expires the local cookie. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request))
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "The request origin is invalid.",
        },
      },
      { status: 403 },
    );
  const env = serverEnv();
  const jar = await cookies();
  const raw = jar.get(env.REFRESH_COOKIE_NAME)?.value;
  let result: unknown = { success: true, data: { loggedOut: true } };
  let status = 200;
  try {
    const authority = await fetch(
      `${env.AUTH_API_BASE_URL}/internal/v1/auth/logout`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-gold-era-bff-trust": env.AUTH_BFF_SHARED_SECRET,
        },
        body: JSON.stringify(raw ? { refreshToken: raw } : {}),
        cache: "no-store",
      },
    );
    result = await authority.json();
    status = authority.status;
  } catch {
    result = {
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message:
          "Remote logout could not be confirmed, but this browser was signed out.",
      },
    };
    status = 503;
  } finally {
    jar.set(clearedRefreshCookie(env));
  }
  return NextResponse.json(result, { status });
}
